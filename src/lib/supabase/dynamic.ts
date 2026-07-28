import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Escape hatch for genuinely dynamic table access.
 *
 * A handful of shared components (row action menus, bulk action bars, status
 * transition widgets) operate on whichever entity they were handed, so the
 * table name is only known at runtime. The typed client cannot check those
 * calls, and forcing it to produces `never` types rather than useful errors.
 *
 * This helper isolates that loss of type safety to a small number of call
 * sites instead of letting `as any` spread through the codebase.
 *
 * RULES:
 *  - Only use this when the table name is a runtime value.
 *  - NEVER use it to silence a legitimate type error on a known table — that
 *    error is telling you the column does not exist, which is exactly the
 *    class of bug this typing was introduced to catch.
 *  - Always check the returned `error`. Dynamic calls get no compile-time
 *    safety net, so the runtime check is the only protection left.
 */
export function dynamicTable(
  supabase: SupabaseClient<Database>,
  table: string
) {
  return (supabase as unknown as SupabaseClient).from(table)
}

/** Table names known at compile time, for callers that can narrow. */
export type TableName = keyof Database['public']['Tables']

/** Runtime guard: is this string actually one of our tables? */
export function isKnownTable(
  table: string,
  known: readonly string[]
): boolean {
  return known.includes(table)
}
