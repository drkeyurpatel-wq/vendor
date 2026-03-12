import { SupabaseClient } from '@supabase/supabase-js'
import {
  sendEmail,
  poCreatedEmail,
  poApprovedEmail,
  grnReceivedEmail,
  paymentProcessedEmail,
  invoiceOverdueEmail,
} from '@/lib/email'
import { logActivity, getNotificationForAction, type AuditAction, type EntityType } from '@/lib/audit'

// ============================================================
// H1 VPMS — Server-side Notification Helper
// Used inside API routes. Fire-and-forget: never throws.
// ============================================================

/**
 * Resolve which users should receive an in-app notification.
 */
async function resolveRecipients(
  supabase: SupabaseClient,
  action: string,
  centreId?: string,
  excludeUserId?: string
): Promise<string[]> {
  const roleMap: Record<string, string[]> = {
    po_submitted: ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin'],
    po_approved: ['unit_purchase_manager', 'store_staff'],
    po_rejected: ['unit_purchase_manager'],
    po_approved_level: ['unit_cao', 'group_cao', 'group_admin'],
    grn_submitted: ['finance_staff', 'unit_cao'],
    grn_verified: ['finance_staff'],
    grn_discrepancy_flagged: ['unit_purchase_manager', 'unit_cao', 'group_cao'],
    invoice_matched: ['finance_staff', 'unit_cao'],
    payment_batch_created: ['group_cao', 'group_admin'],
    payment_batch_approved: ['finance_staff'],
    vendor_blacklisted: ['group_admin', 'group_cao'],
    vendor_document_expired: ['unit_purchase_manager', 'group_cao'],
    reorder_triggered: ['unit_purchase_manager', 'store_staff'],
  }

  const targetRoles = roleMap[action]
  if (!targetRoles || targetRoles.length === 0) return []

  let query = supabase
    .from('user_profiles')
    .select('id')
    .in('role', targetRoles)
    .eq('is_active', true)

  if (centreId) {
    query = query.or(`centre_id.eq.${centreId},role.in.(group_admin,group_cao)`)
  }

  const { data: users } = await query.limit(50)
  const ids = users?.map(u => u.id) || []
  return excludeUserId ? ids.filter(id => id !== excludeUserId) : ids
}

/**
 * Send in-app bell notification to relevant users.
 * Non-blocking: failures logged but not thrown.
 */
export async function sendInAppNotification(
  supabase: SupabaseClient,
  params: {
    action: AuditAction
    entity_type: EntityType
    entity_id?: string
    details?: Record<string, unknown>
    centre_id?: string
    actor_user_id?: string
  }
): Promise<void> {
  try {
    const notification = getNotificationForAction(params.action, params.details)
    if (!notification) return

    const recipients = await resolveRecipients(
      supabase,
      params.action,
      params.centre_id,
      params.actor_user_id
    )

    if (recipients.length === 0) return

    const rows = recipients.map(uid => ({
      user_id: uid,
      title: notification.title,
      message: notification.message,
      type: params.action,
      priority: notification.priority,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      is_read: false,
      created_by: params.actor_user_id || null,
    }))

    const { error } = await supabase.from('notifications').insert(rows)
    if (error) {
      console.warn('[H1 Notify] In-app insert failed:', error.message)
    }
  } catch (err) {
    console.warn('[H1 Notify] In-app notification error:', err)
  }
}

/**
 * Send email to vendor after PO is finally approved.
 * Non-blocking.
 */
export async function emailVendorPOApproved(
  supabase: SupabaseClient,
  poId: string,
  actorUserId: string
): Promise<void> {
  try {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('po_number, vendor:vendors(primary_contact_email)')
      .eq('id', poId)
      .single()

    if (!po) return
    const vendor = po.vendor as any
    const email = vendor?.primary_contact_email as string
    if (!email) return

    const template = poApprovedEmail(email, po.po_number)
    const sent = await sendEmail(email, template.subject, template.html)

    await logActivity(supabase, {
      user_id: actorUserId,
      action: 'notification_sent',
      entity_type: 'purchase_order',
      entity_id: poId,
      details: { type: 'po_approved', email_sent: sent, recipient: email },
    })
  } catch (err) {
    console.warn('[H1 Notify] PO approved email error:', err)
  }
}

/**
 * Send email to vendor after GRN is created (goods received).
 * Non-blocking.
 */
export async function emailVendorGRNReceived(
  supabase: SupabaseClient,
  grnId: string,
  grnNumber: string,
  poId: string,
  actorUserId: string
): Promise<void> {
  try {
    const { data: po } = await supabase
      .from('purchase_orders')
      .select('po_number, vendor:vendors(primary_contact_email)')
      .eq('id', poId)
      .single()

    if (!po) return
    const vendor = po.vendor as any
    const email = vendor?.primary_contact_email as string
    if (!email) return

    const template = grnReceivedEmail(email, grnNumber, po.po_number)
    const sent = await sendEmail(email, template.subject, template.html)

    await logActivity(supabase, {
      user_id: actorUserId,
      action: 'notification_sent',
      entity_type: 'grn',
      entity_id: grnId,
      details: { type: 'grn_received', email_sent: sent, recipient: email },
    })
  } catch (err) {
    console.warn('[H1 Notify] GRN received email error:', err)
  }
}

/**
 * Send payment processed email to each vendor in a completed batch.
 * Non-blocking.
 */
export async function emailVendorsPaymentProcessed(
  supabase: SupabaseClient,
  batchId: string,
  actorUserId: string
): Promise<void> {
  try {
    const { data: batchItems } = await supabase
      .from('payment_batch_items')
      .select('amount, vendor_id, invoice:invoices(vendor_invoice_no, vendor_id)')
      .eq('batch_id', batchId)

    if (!batchItems || batchItems.length === 0) return

    // Group by vendor
    const vendorMap = new Map<string, { amount: number; invoices: { invoice_no: string; amount: number }[] }>()

    for (const item of batchItems) {
      const inv = item.invoice as any
      const vendorId = item.vendor_id || inv?.vendor_id
      if (!vendorId) continue

      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, { amount: 0, invoices: [] })
      }
      const entry = vendorMap.get(vendorId)!
      entry.amount += (item.amount as number) || 0
      entry.invoices.push({
        invoice_no: inv?.vendor_invoice_no || 'N/A',
        amount: (item.amount as number) || 0,
      })
    }

    // Send email to each vendor
    const vendorEntries = Array.from(vendorMap.entries())
    for (const [vendorId, data] of vendorEntries) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('primary_contact_email')
        .eq('id', vendorId)
        .single()

      const email = vendor?.primary_contact_email as string
      if (!email) continue

      const template = paymentProcessedEmail(email, data.amount, data.invoices)
      const sent = await sendEmail(email, template.subject, template.html)

      await logActivity(supabase, {
        user_id: actorUserId,
        action: 'notification_sent',
        entity_type: 'payment_batch',
        entity_id: batchId,
        details: {
          type: 'payment_processed',
          email_sent: sent,
          recipient: email,
          vendor_id: vendorId,
          amount: data.amount,
        },
      })
    }
  } catch (err) {
    console.warn('[H1 Notify] Payment processed email error:', err)
  }
}
