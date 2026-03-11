/**
 * @jest-environment node
 */

/**
 * Tests for GRN Submit API
 * POST /api/grn/submit
 *
 * Business rules tested:
 * - Successful GRN verification
 * - Discrepancy flagging
 * - Auth required
 * - Validation of request body
 * - Activity log entries
 */

// ── Mock dependencies ──
const mockCreateClient = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 }),
}))

import { POST } from '@/app/api/grn/submit/route'
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/grn/submit', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`

function buildChain() {
  const chain: any = {}
  const methods = [
    'select', 'eq', 'neq', 'in', 'is', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'order', 'limit', 'range', 'match',
    'or', 'not', 'filter', 'insert', 'update', 'upsert', 'delete',
  ]
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain)
  }
  chain.single = jest.fn().mockReturnValue({ data: null, error: null })
  chain.then = (resolve: (v: any) => void) => resolve({ data: null, error: null })
  return chain
}

interface BuildOptions {
  user?: any
  grn?: any
}

function buildSupabase(opts: BuildOptions) {
  const {
    user = { id: 'test-user-id' },
    grn = { id: uuid(1), status: 'submitted', po_id: uuid(2) },
  } = opts

  const supabase: any = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      const chain = buildChain()
      if (table === 'grns') {
        chain.single.mockReturnValue({ data: grn, error: null })
      }
      return chain
    }),
  }

  return supabase
}

// ══════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════
describe('POST /api/grn/submit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { rateLimit } = require('@/lib/rate-limit')
    rateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 })
  })

  // ── Auth ──
  it('returns 401 if not authenticated', async () => {
    const supabase = buildSupabase({ user: null })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1), action: 'verify' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  // ── Validation ──
  it('returns 400 if grn_id is missing', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ action: 'verify' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 if action is missing', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1) }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid action value', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1), action: 'delete' }))
    expect(res.status).toBe(400)
  })

  // ── GRN not found ──
  it('returns 404 if GRN not found', async () => {
    const supabase = buildSupabase({ grn: null })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1), action: 'verify' }))
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('GRN not found')
  })

  // ── Successful verification ──
  it('verifies GRN successfully', async () => {
    const supabase = buildSupabase({
      grn: { id: uuid(1), status: 'submitted', po_id: uuid(2) },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1), action: 'verify' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.status).toBe('verified')
  })

  // ── Discrepancy flagging ──
  it('flags GRN discrepancy successfully', async () => {
    const supabase = buildSupabase({
      grn: { id: uuid(1), status: 'submitted', po_id: uuid(2) },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1), action: 'flag_discrepancy' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.status).toBe('discrepancy')
  })

  // ── Activity log ──
  it('logs activity for verification', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    await POST(makeRequest({ grn_id: uuid(1), action: 'verify' }))

    const fromCalls = supabase.from.mock.calls
    const activityLogCalls = fromCalls.filter((c: any[]) => c[0] === 'activity_log')
    expect(activityLogCalls.length).toBeGreaterThan(0)
  })

  it('logs activity for discrepancy flagging', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    await POST(makeRequest({ grn_id: uuid(1), action: 'flag_discrepancy' }))

    const fromCalls = supabase.from.mock.calls
    const activityLogCalls = fromCalls.filter((c: any[]) => c[0] === 'activity_log')
    expect(activityLogCalls.length).toBeGreaterThan(0)
  })

  // ── Updates GRN status ──
  it('calls update on grns table for verify action', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    await POST(makeRequest({ grn_id: uuid(1), action: 'verify' }))

    const fromCalls = supabase.from.mock.calls
    const grnCalls = fromCalls.filter((c: any[]) => c[0] === 'grns')
    // At least 2 calls: one for select/single, one for update
    expect(grnCalls.length).toBeGreaterThanOrEqual(2)
  })

  // ── Rate limit ──
  it('returns 429 when rate limited', async () => {
    const { rateLimit } = require('@/lib/rate-limit')
    rateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60000 })

    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ grn_id: uuid(1), action: 'verify' }))
    expect(res.status).toBe(429)
  })
})
