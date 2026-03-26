import { createClient } from '@/lib/supabase/client'

/**
 * Fire a notification into the notifications table (client-side).
 * The RealtimeNotificationBell picks it up via Supabase Realtime.
 * Non-blocking — never throws.
 *
 * Columns: user_id, title, message, type, priority, entity_type, entity_id, is_read, created_by
 * NO 'action' or 'details' columns exist.
 */
export async function fireNotification(params: {
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, any>
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('notifications').insert({
      type: params.action,
      title: params.action.replace(/_/g, ' '),
      message: params.details ? JSON.stringify(params.details) : null,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      is_read: false,
      created_by: user?.id || null,
      priority: 'normal',
    })
  } catch {
    // Silent — notifications are non-critical
  }
}
