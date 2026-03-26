import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/health
// Returns 200 if app + database are reachable, 503 if not.
// Use this for UptimeRobot, Vercel cron health checks, etc.

export async function GET() {
  const start = Date.now()

  try {
    const supabase = await createClient()

    // Quick DB ping — count active centres (fast, cached by Supabase)
    const { count, error } = await supabase
      .from('centres')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      return NextResponse.json(
        { status: 'unhealthy', db: 'unreachable', error: error.message, latency_ms: Date.now() - start },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      db: 'connected',
      centres: count,
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'unhealthy', error: err instanceof Error ? err.message : 'Unknown error', latency_ms: Date.now() - start },
      { status: 503 }
    )
  }
}
