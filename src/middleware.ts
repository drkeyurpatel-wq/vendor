import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // ── CSRF Protection ──
  // Verify Origin header for state-changing requests
  const method = request.method.toUpperCase()
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // Allow requests without origin (same-origin form submissions, server-side calls)
    // But if origin IS present, it must match the host
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

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
