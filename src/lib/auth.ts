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

export interface ApiAuthSession {
  supabase: SupabaseClient
  user: User
  userId: string
}

export interface ApiAuthSessionWithProfile extends ApiAuthSession {
  profile: AuthSession['profile']
  role: UserRole
  centreId: string | null
  isGroupLevel: boolean
}

// ─── Auth error (thrown in API routes, caught by withApiErrorHandler) ─

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

// ─── Page auth (redirects to /login) ─────────────────────────

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

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) {
    redirect('/')
  }
  return session
}

// ─── API auth (throws AuthError, caught by withApiErrorHandler) ──

export async function requireApiAuth(): Promise<ApiAuthSession> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError()
  }

  return { supabase, user, userId: user.id }
}

export async function requireApiAuthWithProfile(): Promise<ApiAuthSessionWithProfile> {
  const { supabase, user, userId } = await requireApiAuth()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(id, code, name)')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new AuthError('Profile not found')
  }

  const role = profile.role as UserRole
  const isGroupLevel = ['group_admin', 'group_cao'].includes(role)

  return {
    supabase,
    user,
    userId,
    profile: profile as AuthSession['profile'],
    role,
    centreId: profile.centre_id,
    isGroupLevel,
  }
}
