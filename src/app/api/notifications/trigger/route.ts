import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { logActivity, getNotificationForAction, type AuditAction, type EntityType } from '@/lib/audit'

// ============================================================
// H1 VPMS — Notification Trigger API
// Called after key actions to notify the right users in real-time
// Uses Supabase Realtime via the notifications table
// ============================================================

interface TriggerRequest {
  action: AuditAction
  entity_type: EntityType
  entity_id?: string
  details?: Record<string, unknown>
  // Optionally specify recipients; otherwise auto-resolved
  recipient_ids?: string[]
  // Centre ID for scoping notifications
  centre_id?: string
}

/**
 * Resolve which users should receive a notification based on the action.
 */
async function resolveRecipients(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  action: AuditAction,
  centreId?: string
): Promise<string[]> {
  const roleMap: Record<string, string[]> = {
    // PO needs approval → notify approvers
    po_submitted: ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin'],
    po_approved: ['unit_purchase_manager', 'store_staff'],
    po_rejected: ['unit_purchase_manager'],
    po_approved_level: ['unit_cao', 'group_cao', 'group_admin'],
    // GRN → notify finance
    grn_submitted: ['finance_staff', 'unit_cao'],
    grn_verified: ['finance_staff'],
    grn_discrepancy_flagged: ['unit_purchase_manager', 'unit_cao', 'group_cao'],
    // Invoice → notify finance + CAO
    invoice_matched: ['finance_staff', 'unit_cao'],
    // Payment → notify CAO
    payment_batch_created: ['group_cao', 'group_admin'],
    payment_batch_approved: ['finance_staff'],
    // Vendor → notify admin
    vendor_blacklisted: ['group_admin', 'group_cao'],
    vendor_document_expired: ['unit_purchase_manager', 'group_cao'],
    // Stock
    reorder_triggered: ['unit_purchase_manager', 'store_staff'],
  }

  const targetRoles = roleMap[action]
  if (!targetRoles || targetRoles.length === 0) return []

  let query = supabase
    .from('user_profiles')
    .select('id')
    .in('role', targetRoles)
    .eq('is_active', true)

  // Scope to centre if provided (except group-level roles)
  if (centreId) {
    query = query.or(`centre_id.eq.${centreId},role.in.(group_admin,group_cao)`)
  }

  const { data: users } = await query.limit(50)
  return users?.map(u => u.id) || []
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: TriggerRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, entity_type, entity_id, details, recipient_ids, centre_id } = body

  if (!action || !entity_type) {
    return NextResponse.json({ error: 'action and entity_type required' }, { status: 400 })
  }

  // 1. Log to audit trail
  await logActivity(supabase, {
    user_id: user.id,
    action,
    entity_type,
    entity_id,
    details,
  })

  // 2. Build notification content
  const notification = getNotificationForAction(action, details)
  if (!notification) {
    return NextResponse.json({ logged: true, notified: false, reason: 'No notification template for this action' })
  }

  // 3. Resolve recipients
  const recipients = recipient_ids && recipient_ids.length > 0
    ? recipient_ids
    : await resolveRecipients(supabase, action, centre_id)

  if (recipients.length === 0) {
    return NextResponse.json({ logged: true, notified: false, reason: 'No recipients found' })
  }

  // 4. Insert notifications for each recipient
  const notificationRows = recipients
    .filter(rid => rid !== user.id) // Don't notify the actor
    .map(recipientId => ({
      user_id: recipientId,
      title: notification.title,
      message: notification.message,
      type: action,
      priority: notification.priority,
      entity_type,
      entity_id: entity_id || null,
      is_read: false,
      created_by: user.id,
    }))

  if (notificationRows.length > 0) {
    const { error } = await supabase
      .from('notifications')
      .insert(notificationRows)

    if (error) {
      // Notifications table might not exist yet — log but don't fail
      console.error('[Notification] Insert failed:', error.message)
      return NextResponse.json({
        logged: true,
        notified: false,
        reason: `Notification insert failed: ${error.message}`,
      })
    }
  }

  return NextResponse.json({
    logged: true,
    notified: true,
    recipients_count: notificationRows.length,
  })
}
