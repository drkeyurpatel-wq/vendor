/**
 * Client-side notification dispatch.
 *
 * This delegates to /api/notifications/trigger, which resolves the correct
 * recipients by role and centre and writes one row per recipient.
 *
 * It deliberately does NOT insert into `notifications` directly: that table
 * requires a non-null `user_id` (the recipient), which the client cannot
 * resolve without reading other users' profiles. Writing directly here is
 * what caused every notification insert to be rejected silently.
 *
 * Non-blocking — never throws.
 */
export async function fireNotification(params: {
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  /** Optional explicit recipients; otherwise resolved by role on the server. */
  recipient_ids?: string[]
  /** Centre to scope recipients to. */
  centre_id?: string
}) {
  try {
    const res = await fetch('/api/notifications/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok && process.env.NODE_ENV !== 'production') {
      console.warn('fireNotification failed', res.status, await res.text())
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('fireNotification error', err)
  }
}
