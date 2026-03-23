import { createClient } from '@/lib/supabase/client'

/**
 * Fire a notification into the notifications table.
 * The RealtimeNotificationBell will pick it up via Supabase Realtime.
 * Non-blocking — never throws.
 */
export async function fireNotification(params: {
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, any>
}) {
  try {
    const supabase = createClient()
    await supabase.from('notifications').insert({
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      details: params.details || null,
      is_read: false,
    })
  } catch {
    // Silent — notifications are non-critical
  }
}
