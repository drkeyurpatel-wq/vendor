import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_COOKIE = 'h1_last_activity'

export async function middleware(request: NextRequest) {
  // ── CSRF Protection ──
  const method = request.method.toUpperCase()
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin && host) {
      let originHost: string
      try {
        originHost = new URL(origin).host
      } catch {
        return NextResponse.json(
          { error: 'Invalid origin header' },
          { status: 403 }
        )
      }

      if (originHost !== host) {
        return NextResponse.json(
          { error: 'Cross-origin request blocked' },
          { status: 403 }
        )
      }
    }
  }

  // ── Session Timeout Check ──
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/reset-password')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isHeartbeat = request.nextUrl.pathname === '/api/auth/heartbeat'

  if (!isAuthPage && !isApiRoute) {
    const lastActivity = request.cookies.get(ACTIVITY_COOKIE)?.value
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      if (elapsed > SESSION_TIMEOUT_MS) {
        // Session timed out — redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('timeout', '1')
        const response = NextResponse.redirect(url)
        response.cookies.delete(ACTIVITY_COOKIE)
        return response
      }
    }
  }

  const response = await updateSession(request)

  // Update activity timestamp on every non-API request (and heartbeats)
  if (!isAuthPage && (!isApiRoute || isHeartbeat)) {
    response.cookies.set(ACTIVITY_COOKIE, String(Date.now()), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TIMEOUT_MS / 1000,
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
