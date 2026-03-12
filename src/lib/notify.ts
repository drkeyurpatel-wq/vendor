// ============================================================
// H1 VPMS — Client-side Notification Helper
// Fire-and-forget: call after business action succeeds.
// Never blocks the UI. Logs failures to console only.
// ============================================================

type NotificationType =
  | 'po_created'
  | 'po_approved'
  | 'grn_received'
  | 'payment_processed'
  | 'invoice_overdue'

type TriggerAction =
  | 'po_created'
  | 'po_submitted'
  | 'po_approved'
  | 'po_rejected'
  | 'po_approved_level'
  | 'grn_created'
  | 'grn_submitted'
  | 'grn_verified'
  | 'grn_discrepancy_flagged'
  | 'invoice_matched'
  | 'payment_batch_created'
  | 'payment_batch_approved'
  | 'payment_batch_released'
  | 'vendor_blacklisted'
  | 'vendor_document_expired'
  | 'reorder_triggered'

/**
 * Fire-and-forget: send an email notification via /api/notifications/send.
 * Does NOT block or throw — safe to call without await.
 */
export function fireEmailNotification(
  type: NotificationType,
  data: Record<string, unknown>
): void {
  fetch('/api/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  }).then(res => {
    if (!res.ok) {
      console.warn(`[H1 Notify] Email notification failed (${type}):`, res.status)
    }
  }).catch(err => {
    console.warn(`[H1 Notify] Email notification error (${type}):`, err.message)
  })
}

/**
 * Fire-and-forget: trigger in-app notification via /api/notifications/trigger.
 * Creates real-time bell notifications for relevant users.
 * Does NOT block or throw.
 */
export function fireInAppNotification(
  action: TriggerAction,
  entity_type: string,
  entity_id?: string,
  details?: Record<string, unknown>,
  centre_id?: string
): void {
  fetch('/api/notifications/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, entity_type, entity_id, details, centre_id }),
  }).then(res => {
    if (!res.ok) {
      console.warn(`[H1 Notify] In-app notification failed (${action}):`, res.status)
    }
  }).catch(err => {
    console.warn(`[H1 Notify] In-app notification error (${action}):`, err.message)
  })
}

/**
 * Convenience: fire BOTH email + in-app notification.
 * Use for key business events that vendors + staff both need to know about.
 */
export function notifyAll(params: {
  // Email params
  emailType?: NotificationType
  emailData?: Record<string, unknown>
  // In-app params
  action: TriggerAction
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  centre_id?: string
}): void {
  // In-app always fires
  fireInAppNotification(
    params.action,
    params.entity_type,
    params.entity_id,
    params.details,
    params.centre_id
  )

  // Email only fires if type provided
  if (params.emailType && params.emailData) {
    fireEmailNotification(params.emailType, params.emailData)
  }
}
