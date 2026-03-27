// ============================================================
// H1 VPMS — Vendor Portal Auth
// Session-token based auth (separate from Supabase Auth)
// Vendors log in via phone + OTP; session stored in cookie
// ============================================================

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const COOKIE_NAME = 'h1-vendor-session'
const PORTAL_LOGIN_PATH = '/vendor/login'

export interface VendorSession {
  vendorId: string
  vendorCode: string
  legalName: string
  phone: string
}

/**
 * Get admin Supabase client (bypasses RLS)
 */
function getAdminClient() {
  return createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Require vendor auth for page components.
 * Redirects to /vendor/login if no valid session.
 */
export async function requireVendorAuth(): Promise<VendorSession & { supabase: ReturnType<typeof createAdminClient> }> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    redirect(PORTAL_LOGIN_PATH)
  }

  const admin = getAdminClient()
  const { data, error } = await admin.rpc('validate_vendor_session', { p_token: token })

  if (error || !data?.valid) {
    // Clear invalid cookie
    cookieStore.delete(COOKIE_NAME)
    redirect(PORTAL_LOGIN_PATH)
  }

  if (data.portal_access === false) {
    redirect(PORTAL_LOGIN_PATH + '?error=access_disabled')
  }

  return {
    supabase: admin,
    vendorId: data.vendor_id,
    vendorCode: data.vendor_code,
    legalName: data.legal_name,
    phone: data.phone,
  }
}

/**
 * API route auth — returns null if invalid (doesn't redirect)
 */
export async function requireVendorApiAuth(): Promise<(VendorSession & { supabase: ReturnType<typeof createAdminClient> }) | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  const admin = getAdminClient()
  const { data, error } = await admin.rpc('validate_vendor_session', { p_token: token })

  if (error || !data?.valid || data.portal_access === false) return null

  return {
    supabase: admin,
    vendorId: data.vendor_id,
    vendorCode: data.vendor_code,
    legalName: data.legal_name,
    phone: data.phone,
  }
}

/**
 * Set session cookie after successful OTP verification
 */
export async function setVendorSessionCookie(sessionToken: string, expiresAt: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAt),
  })
}

/**
 * Clear session cookie (logout)
 */
export async function clearVendorSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Check if vendor session exists (for middleware)
 */
export function getVendorTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}
