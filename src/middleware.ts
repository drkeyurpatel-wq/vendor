import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Vendor portal subdomain — routes to /vendor/* pages
const VENDOR_HOSTNAME = 'vendors.health1.co.in'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // ── Vendor Portal Subdomain Routing ──
  const isVendorSubdomain = hostname === VENDOR_HOSTNAME || hostname.startsWith('vendors.')

  if (isVendorSubdomain) {
    // Allow static assets, API routes, _next through
    if (pathname.startsWith('/_next') || pathname.startsWith('/api/') || pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)) {
      return NextResponse.next()
    }

    // Rewrite root to vendor portal dashboard
    if (pathname === '/' || pathname === '') {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor'
      return NextResponse.rewrite(url)
    }

    // If path doesn't start with /vendor, prefix it
    if (!pathname.startsWith('/vendor')) {
      const url = request.nextUrl.clone()
      url.pathname = `/vendor${pathname}`
      return NextResponse.rewrite(url)
    }

    // Vendor paths use own cookie auth, skip Supabase session
    return NextResponse.next()
  }

  // ── Vendor portal paths on main domain (direct /vendor/* access) ──
  if (pathname === '/vendor' || pathname.startsWith('/vendor/')) {
    return NextResponse.next()
  }

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

      // Allow vendor subdomain to call main domain APIs
      if (originHost !== host && originHost !== VENDOR_HOSTNAME) {
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
