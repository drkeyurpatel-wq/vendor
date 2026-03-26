import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// ============================================================
// H1 VPMS — Multi-Level PO Approval Engine
// Thresholds: <₹50K = PM, <₹2L = CAO, <₹10L = Group CAO, ≥₹10L = MD
// SLA: 24 hours per level. Auto-escalates via cron.
// Supports delegation (CAO on leave → delegate acts on behalf)
// ============================================================

const APPROVAL_LEVELS = [
  { level: 1, role: 'unit_purchase_manager', threshold: 50000, label: 'Purchase Manager', sla_hours: 24 },
  { level: 2, role: 'unit_cao', threshold: 200000, label: 'Unit CAO', sla_hours: 24 },
  { level: 3, role: 'group_cao', threshold: 1000000, label: 'Group CAO', sla_hours: 48 },
  { level: 4, role: 'group_admin', threshold: Infinity, label: 'Managing Director', sla_hours: 72 },
]

function getRequiredLevel(amount: number): number {
  for (const lvl of APPROVAL_LEVELS) {
    if (amount <= lvl.threshold) return lvl.level
  }
  return APPROVAL_LEVELS.length
}

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { po_id, action, comments } = body // action: 'approve' | 'reject'

  if (!po_id || !action) return NextResponse.json({ error: 'po_id and action required' }, { status: 400 })

  // Get PO
  const { data: po } = await supabase.from('purchase_orders')
    .select('id, po_number, total_amount, current_approval_level, status, centre_id')
    .eq('id', po_id).single()
  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  if (po.status === 'cancelled') return NextResponse.json({ error: 'PO is cancelled' }, { status: 400 })

  // Get approver profile
  const { data: profile } = await supabase.from('user_profiles').select('id, role, full_name, centre_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Check delegation — is someone acting on behalf?
  const { data: delegation } = await supabase.from('approval_delegations')
    .select('delegator_id')
    .eq('delegate_id', user.id)
    .eq('is_active', true)
    .lte('start_date', new Date().toISOString().split('T')[0])
    .gte('end_date', new Date().toISOString().split('T')[0])
    .limit(1).single()

  const actingFor = delegation?.delegator_id || null

  // Determine required approval level
  const requiredLevel = getRequiredLevel(po.total_amount || 0)
  const currentLevel = po.current_approval_level || 0

  // Check if user's role matches current level requirement
  const currentLevelConfig = APPROVAL_LEVELS.find(l => l.level === currentLevel + 1)
  if (!currentLevelConfig) return NextResponse.json({ error: 'PO fully approved or invalid level' }, { status: 400 })

  const canApprove = profile.role === currentLevelConfig.role ||
    profile.role === 'group_admin' || // MD can approve anything
    (actingFor && delegation) // Delegate can act on behalf

  if (!canApprove) {
    return NextResponse.json({
      error: `Requires ${currentLevelConfig.label} approval. Your role: ${profile.role}`,
      required_role: currentLevelConfig.role,
      your_role: profile.role,
    }, { status: 403 })
  }

  const slaDeadline = new Date(Date.now() + (currentLevelConfig.sla_hours * 60 * 60 * 1000))

  if (action === 'approve') {
    // Record approval at this level
    await supabase.from('po_approvals').insert({
      po_id, approval_level: currentLevel + 1,
      approver_id: user.id, approver_role: profile.role,
      status: 'approved', comments: comments || null,
      actioned_at: new Date().toISOString(),
      sla_deadline: slaDeadline.toISOString(),
      delegated_from: actingFor,
      delegation_reason: actingFor ? 'Acting on behalf (delegation)' : null,
    })

    // Audit trail
    await supabase.from('audit_trail').insert({
      entity_type: 'purchase_order', entity_id: po_id,
      field_name: 'approval_level',
      old_value: String(currentLevel),
      new_value: String(currentLevel + 1),
      changed_by: user.id,
    })

    const newLevel = currentLevel + 1
    if (newLevel >= requiredLevel) {
      // Fully approved
      await supabase.from('purchase_orders').update({
        status: 'approved', current_approval_level: newLevel,
        approved_by: user.id, approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', po_id)

      return NextResponse.json({
        status: 'fully_approved', level: newLevel, required: requiredLevel,
        message: `PO ${po.po_number} fully approved at level ${newLevel}`,
      })
    } else {
      // Needs next level
      const nextLevel = APPROVAL_LEVELS.find(l => l.level === newLevel + 1)
      await supabase.from('purchase_orders').update({
        current_approval_level: newLevel, status: 'pending_approval',
        updated_at: new Date().toISOString(),
      }).eq('id', po_id)

      return NextResponse.json({
        status: 'level_approved', level: newLevel, required: requiredLevel,
        next_approver: nextLevel?.label,
        message: `Level ${newLevel} approved. Needs ${nextLevel?.label} approval.`,
      })
    }
  } else if (action === 'reject') {
    if (!comments?.trim()) return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })

    await supabase.from('po_approvals').insert({
      po_id, approval_level: currentLevel + 1,
      approver_id: user.id, approver_role: profile.role,
      status: 'rejected', comments,
      actioned_at: new Date().toISOString(),
      delegated_from: actingFor,
    })

    await supabase.from('purchase_orders').update({
      status: 'rejected', updated_at: new Date().toISOString(),
    }).eq('id', po_id)

    await supabase.from('audit_trail').insert({
      entity_type: 'purchase_order', entity_id: po_id,
      field_name: 'status', old_value: po.status, new_value: 'rejected',
      changed_by: user.id,
    })

    return NextResponse.json({ status: 'rejected', message: `PO ${po.po_number} rejected` })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
})

// GET: Check approval status and next required approver
export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const poId = request.nextUrl.searchParams.get('po_id')
  if (!poId) return NextResponse.json({ error: 'po_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: po } = await supabase.from('purchase_orders')
    .select('id, po_number, total_amount, current_approval_level, status')
    .eq('id', poId).single()
  if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const requiredLevel = getRequiredLevel(po.total_amount || 0)
  const { data: approvals } = await supabase.from('po_approvals')
    .select('approval_level, approver_role, status, comments, actioned_at, sla_deadline, delegated_from')
    .eq('po_id', poId).order('approval_level')

  const nextLevel = APPROVAL_LEVELS.find(l => l.level === (po.current_approval_level || 0) + 1)

  return NextResponse.json({
    po_number: po.po_number,
    amount: po.total_amount,
    current_level: po.current_approval_level || 0,
    required_level: requiredLevel,
    fully_approved: (po.current_approval_level || 0) >= requiredLevel,
    next_approver: nextLevel || null,
    levels: APPROVAL_LEVELS.map(l => ({
      ...l,
      required: l.level <= requiredLevel,
      completed: approvals?.find(a => a.approval_level === l.level),
    })),
  })
})
