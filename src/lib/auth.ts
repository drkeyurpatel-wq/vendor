import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserProfile, UserRole } from '@/types/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// ─── Return types ────────────────────────────────────────────

export interface AuthSession {
  supabase: SupabaseClient
  user: User
  profile: UserProfile & { centre?: { id: string; code: string; name: string } }
  role: UserRole
  centreId: string | null
  isGroupLevel: boolean
}

// ─── Core auth helper ────────────────────────────────────────
// Replaces the 12-line auth + profile block duplicated across 54 pages.
// Returns typed session or redirects to /login — caller never sees null.

export async function requireAuth(): Promise<AuthSession> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(id, code, name)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  const role = profile.role as UserRole
  const isGroupLevel = ['group_admin', 'group_cao'].includes(role)

  return {
    supabase,
    user,
    profile: profile as AuthSession['profile'],
    role,
    centreId: profile.centre_id,
    isGroupLevel,
  }
}

// ─── Role guard ──────────────────────────────────────────────
// Use when a page is restricted to specific roles.
// Example: const session = await requireRole(['group_admin', 'group_cao'])

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) {
    redirect('/')
  }
  return session
}
