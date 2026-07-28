import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail loudly rather than falling back to a placeholder host. A
  // misconfigured deployment should be obvious, not look like an empty
  // database. Checked here rather than at module scope so that importing
  // this file stays side-effect free (module-level throws break prerender).
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set. See .env.example.'
    )
  }

  return createBrowserClient<Database>(url, anonKey)
}
