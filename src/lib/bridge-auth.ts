import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate bridge requests from HMIS.
 * HMIS must send header: X-Bridge-Secret: <HMIS_BRIDGE_SECRET>
 * Returns null if valid, NextResponse error if invalid.
 */
export function validateBridge(request: NextRequest): NextResponse | null {
  const secret = process.env.HMIS_BRIDGE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'HMIS_BRIDGE_SECRET not configured on VPMS' }, { status: 503 })
  }
  const provided = request.headers.get('x-bridge-secret')
  if (provided !== secret) {
    return NextResponse.json({ error: 'Invalid bridge secret' }, { status: 401 })
  }
  return null // Valid
}

/**
 * Standard bridge response format.
 * All bridge endpoints return this shape so HMIS can parse consistently.
 */
export interface BridgeResponse {
  success: boolean
  source: 'vpms'
  flow: string
  data?: any
  error?: string
  timestamp: string
}

export function bridgeSuccess(flow: string, data: any): NextResponse {
  return NextResponse.json({
    success: true, source: 'vpms', flow,
    data, timestamp: new Date().toISOString(),
  } satisfies BridgeResponse)
}

export function bridgeError(flow: string, error: string, status = 400): NextResponse {
  return NextResponse.json({
    success: false, source: 'vpms', flow,
    error, timestamp: new Date().toISOString(),
  } satisfies BridgeResponse, { status })
}
