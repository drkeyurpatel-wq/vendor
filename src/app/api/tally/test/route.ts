import { NextResponse } from 'next/server'

const TALLY_URL = process.env.TALLY_SERVER_URL || ''

export async function GET() {
  if (!TALLY_URL) {
    return NextResponse.json({
      connected: false,
      error: 'TALLY_SERVER_URL environment variable is not configured',
    })
  }

  try {
    // Tally Prime responds to a simple GET request on its HTTP port
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(TALLY_URL, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeout)

    return NextResponse.json({
      connected: true,
      status: res.status,
      url: TALLY_URL,
      message: 'Tally server is reachable',
    })
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      url: TALLY_URL,
      error: err?.name === 'AbortError'
        ? 'Connection timed out (5s). Ensure Tally is running and accessible.'
        : `Connection failed: ${err?.message || 'Unknown error'}`,
    })
  }
}
