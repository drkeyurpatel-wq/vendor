import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// H1 VPMS — Combined Daily Cron
// Runs both document expiry check and auto-reorder in one call
// Vercel Hobby plan only allows 1 cron job
// ============================================================

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  // Allow Vercel cron or Bearer token auth
  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}
  const baseUrl = request.nextUrl.origin

  // 1. Document expiry check
  try {
    const res = await fetch(`${baseUrl}/api/documents/expiry-check`, {
      headers: { 'Authorization': `Bearer ${cronSecret}` },
    })
    results.expiry_check = { status: res.status, ok: res.ok }
    if (res.ok) {
      results.expiry_check.data = await res.json()
    }
  } catch (err: any) {
    results.expiry_check = { error: err.message }
  }

  // 2. Auto-reorder (only Mon-Sat)
  const day = new Date().getDay() // 0=Sun, 6=Sat
  if (day >= 1 && day <= 6) {
    try {
      const res = await fetch(`${baseUrl}/api/reorder`, {
        headers: { 'Authorization': `Bearer ${cronSecret}` },
      })
      results.reorder = { status: res.status, ok: res.ok }
      if (res.ok) {
        results.reorder.data = await res.json()
      }
    } catch (err: any) {
      results.reorder = { error: err.message }
    }
  } else {
    results.reorder = { skipped: 'Sunday — no reorder' }
  }

  return NextResponse.json({
    message: 'Daily cron completed',
    timestamp: new Date().toISOString(),
    results,
  })
}
