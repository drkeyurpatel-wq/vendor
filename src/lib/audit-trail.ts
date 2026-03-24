import { createClient } from '@/lib/supabase/client'

/**
 * Track field-level changes for audit compliance.
 * Call BEFORE updating any entity — pass old and new values.
 * Non-blocking, never throws.
 */
export async function trackChanges(params: {
  entity_type: string
  entity_id: string
  changes: Record<string, { old: any; new: any }>
  changed_by?: string
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = params.changed_by || user?.id

    const rows = Object.entries(params.changes)
      .filter(([_, v]) => String(v.old ?? '') !== String(v.new ?? ''))
      .map(([field, v]) => ({
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        field_name: field,
        old_value: v.old != null ? String(v.old) : null,
        new_value: v.new != null ? String(v.new) : null,
        changed_by: userId,
      }))

    if (rows.length > 0) {
      await supabase.from('audit_trail').insert(rows)
    }
  } catch {
    // Silent — audit is non-critical
  }
}

/**
 * Compute diff between two objects for audit tracking.
 * Returns only changed fields.
 */
export function computeDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  fieldsToTrack: string[]
): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {}
  for (const field of fieldsToTrack) {
    const oldVal = oldObj[field]
    const newVal = newObj[field]
    if (String(oldVal ?? '') !== String(newVal ?? '')) {
      changes[field] = { old: oldVal, new: newVal }
    }
  }
  return changes
}
