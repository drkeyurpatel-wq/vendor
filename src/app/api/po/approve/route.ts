import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { canApprovePO, PO_APPROVAL_THRESHOLD } from '@/types/database'
import type { UserRole } from '@/types/database'
import { rateLimit } from '@/lib/rate-limit'
import { poApprovalSchema } from '@/lib/validations'
import { sendInAppNotification, emailVendorPOApproved } from '@/lib/notify-server'

/**
 * Multi-level sequential PO approval chain.
 * Each approval level must be approved in order.
 * Only the current pending level can be actioned.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = poApprovalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { po_id, action, comments } = parsed.data

  // Get PO
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id, status, total_amount, current_approval_level')
    .eq('id', po_id)
    .single()

  if (!po) {
    return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  }

  if (po.status !== 'pending_approval') {
    return NextResponse.json({ error: 'PO is not pending approval' }, { status: 400 })
  }

  if (!canApprovePO(profile.role as UserRole, po.total_amount)) {
    return NextResponse.json({ error: 'Insufficient approval authority' }, { status: 403 })
  }

  if (action === 'reject' && !comments?.trim()) {
    return NextResponse.json({ error: 'Comments required for rejection' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const currentLevel = po.current_approval_level || 1

  // Get current pending approval record
  const { data: currentApproval } = await supabase
    .from('po_approvals')
    .select('id, approval_level, approver_role')
    .eq('po_id', po_id)
    .eq('approval_level', currentLevel)
    .eq('status', 'pending')
    .single()

  if (!currentApproval) {
    return NextResponse.json({ error: 'No pending approval at current level' }, { status: 400 })
  }

  // Update current approval record
  await supabase.from('po_approvals')
    .update({
      approver_id: user.id,
      status: action === 'approve' ? 'approved' : 'rejected',
      comments: comments?.trim() || null,
      actioned_at: now,
    })
    .eq('id', currentApproval.id)

  if (action === 'reject') {
    // Rejection at any level cancels the PO
    await supabase.from('purchase_orders')
      .update({ status: 'cancelled', updated_at: now })
      .eq('id', po_id)

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'po_rejected',
      entity_type: 'purchase_order',
      entity_id: po_id,
      details: { level: currentLevel, comments: comments?.trim() || null },
    })

    // Notify: PO rejected → in-app to PO creator/purchase team
    sendInAppNotification(supabase, {
      action: 'po_rejected',
      entity_type: 'purchase_order',
      entity_id: po_id,
      details: { po_number: po_id, comments: comments?.trim() || null },
      actor_user_id: user.id,
    }).catch(() => {}) // fire-and-forget

    return NextResponse.json({ success: true, status: 'cancelled' })
  }

  // Approval — determine if more levels are needed
  const amount = po.total_amount
  const requiredLevels = getRequiredApprovalLevels(amount)

  if (currentLevel < requiredLevels.length) {
    // More approvals needed — advance to next level
    const nextLevel = currentLevel + 1
    const nextRole = requiredLevels[nextLevel - 1]

    await supabase.from('po_approvals').insert({
      po_id: po_id,
      approval_level: nextLevel,
      approver_role: nextRole,
      status: 'pending',
    })

    await supabase.from('purchase_orders')
      .update({ current_approval_level: nextLevel, updated_at: now })
      .eq('id', po_id)

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'po_approved_level',
      entity_type: 'purchase_order',
      entity_id: po_id,
      details: { level: currentLevel, next_level: nextLevel, next_role: nextRole },
    })

    // Notify: next approver needs to act
    sendInAppNotification(supabase, {
      action: 'po_approved_level',
      entity_type: 'purchase_order',
      entity_id: po_id,
      details: { po_number: po_id, level: currentLevel, next_role: nextRole },
      actor_user_id: user.id,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      status: 'pending_approval',
      message: `Approved at level ${currentLevel}. Awaiting ${nextRole.replace(/_/g, ' ')} approval.`,
    })
  }

  // Final approval — PO is fully approved
  await supabase.from('purchase_orders')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: now,
      updated_at: now,
    })
    .eq('id', po_id)

  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'po_approved',
    entity_type: 'purchase_order',
    entity_id: po_id,
    details: { level: currentLevel, final: true },
  })

  // Notify: PO fully approved → email vendor + in-app to staff
  emailVendorPOApproved(supabase, po_id, user.id).catch(() => {})
  sendInAppNotification(supabase, {
    action: 'po_approved',
    entity_type: 'purchase_order',
    entity_id: po_id,
    details: { po_number: po_id, final: true },
    actor_user_id: user.id,
  }).catch(() => {})

  return NextResponse.json({ success: true, status: 'approved' })
}

/**
 * Returns the ordered list of approval roles needed for a given amount.
 * ≤₹10K: auto-approved (no levels)
 * ₹10K-50K: [unit_purchase_manager]
 * ₹50K-2L: [unit_purchase_manager, unit_cao]
 * ₹2L-10L: [unit_purchase_manager, unit_cao, group_cao]
 * >₹10L: [unit_purchase_manager, unit_cao, group_cao, group_admin]
 */
function getRequiredApprovalLevels(amount: number): string[] {
  if (amount <= PO_APPROVAL_THRESHOLD.auto) return []
  if (amount <= PO_APPROVAL_THRESHOLD.unit_pm) return ['unit_purchase_manager']
  if (amount <= PO_APPROVAL_THRESHOLD.unit_cao) return ['unit_purchase_manager', 'unit_cao']
  if (amount <= PO_APPROVAL_THRESHOLD.group_cao) return ['unit_purchase_manager', 'unit_cao', 'group_cao']
  return ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin']
}
