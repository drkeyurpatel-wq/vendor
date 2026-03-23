import { NextResponse } from 'next/server'

// Lightweight endpoint pinged by the client-side heartbeat to keep the session alive.
// The middleware handles updating the activity cookie on each request.
export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() })
}
