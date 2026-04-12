/**
 * @jest-environment node
 */

/**
 * Tests for the 3-Way Matching Engine
 * POST /api/invoices/match
 *
 * Business rules tested:
 * - MATCHED: PO qty = GRN qty = Invoice qty AND PO rate = Invoice rate (within 0.5%)
 * - PARTIAL_MATCH: some items match, some don't
 * - MISMATCH: significant discrepancy — blocks payment
 * - No PO linked = mismatch (No PO = No Payment rule)
 */

// ── Mock dependencies before importing the route ──
const mockCreateClient = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 }),
}))

// Import after mocking
import { POST } from '@/app/api/invoices/match/route'
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/invoices/match', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`

describe('3-Way Matching Engine — POST /api/invoices/match', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-mock rateLimit for each test (since clearAllMocks resets it)
    const { rateLimit } = require('@/lib/rate-limit')
    rateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 })
  })

  // ── Auth ──
  it('returns 401 if not authenticated', async () => {
    const supabase = buildMockSupabase({})
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: uuid(1) }))
    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  // ── Validation ──
  it('returns 400 if invoice_id missing', async () => {
    const supabase = buildMockSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  // ── Invoice not found ──
  it('returns 404 if invoice not found', async () => {
    const supabase = buildMockSupabase({})
    supabase.from.mockImplementation((table: string) => {
      const chain = buildChain()
      if (table === 'invoices') {
        chain.single.mockReturnValue({ data: null, error: null })
      }
      return chain
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: uuid(1) }))
    expect(res.status).toBe(404)
  })

  // ── No PO linked → mismatch ──
  it('returns mismatch when no PO is linked (No PO = No Payment)', async () => {
    const supabase = buildMockSupabase({})
    supabase.from.mockImplementation((table: string) => {
      const chain = buildChain()
      if (table === 'invoices') {
        chain.single.mockReturnValue({
          data: { id: uuid(1), po_id: null, grn: null, total_amount: 5000 },
          error: null,
        })
      }
      return chain
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: uuid(1) }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.match_status).toBe('mismatch')
    expect(json.reason).toContain('No PO')
  })

  // ── Perfect match ──
  it('returns "matched" when PO, GRN, and Invoice all agree', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 100, poRate: 50, grnAcceptedQty: 100, invoiceQty: 100, invoiceRate: 50 },
      ],
      invoiceTotalAmount: 5000,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.match_status).toBe('matched')
    expect(json.results).toHaveLength(1)
    expect(json.results[0].qty_match).toBe(true)
    expect(json.results[0].rate_match).toBe(true)
    expect(json.summary.matched).toBe(1)
    expect(json.summary.mismatched).toBe(0)
  })

  // ── Quantity mismatch ──
  it('detects quantity mismatch (GRN qty != Invoice qty)', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 100, poRate: 50, grnAcceptedQty: 80, invoiceQty: 100, invoiceRate: 50 },
      ],
      invoiceTotalAmount: 5000,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.results[0].qty_match).toBe(false)
    expect(json.results[0].rate_match).toBe(true)
    expect(json.match_status).not.toBe('matched')
  })

  // ── Rate mismatch ──
  it('detects rate mismatch (PO rate != Invoice rate beyond tolerance)', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    // Rate difference > 0.5%: 50 vs 55 = 10% diff
    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 100, poRate: 50, grnAcceptedQty: 100, invoiceQty: 100, invoiceRate: 55 },
      ],
      invoiceTotalAmount: 5500,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.results[0].rate_match).toBe(false)
    expect(json.results[0].qty_match).toBe(true)
    expect(json.match_status).not.toBe('matched')
  })

  // ── Both mismatch ──
  it('detects both qty and rate mismatch', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 100, poRate: 50, grnAcceptedQty: 80, invoiceQty: 100, invoiceRate: 60 },
      ],
      invoiceTotalAmount: 6000,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.results[0].qty_match).toBe(false)
    expect(json.results[0].rate_match).toBe(false)
  })

  // ── Rate tolerance (within 0.5%) ──
  it('accepts rate within 0.5% tolerance as match', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    // 0.5% of 100 = 0.5 → invoice rate 100.49 should match
    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 50, poRate: 100, grnAcceptedQty: 50, invoiceQty: 50, invoiceRate: 100.49 },
      ],
      invoiceTotalAmount: 5024.5,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.results[0].rate_match).toBe(true)
  })

  it('rejects rate just outside 0.5% tolerance', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    // 0.5% of 100 = 0.5 → invoice rate 100.60 should NOT match
    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 50, poRate: 100, grnAcceptedQty: 50, invoiceQty: 50, invoiceRate: 100.60 },
      ],
      invoiceTotalAmount: 5030,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.results[0].rate_match).toBe(false)
  })

  // ── Partial match (multi-item) ──
  it('returns partial_match when some items match and some dont', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const item1 = uuid(3)
    const item2 = uuid(4)
    const grnId = uuid(5)

    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId: item1, poQty: 100, poRate: 50, grnAcceptedQty: 100, invoiceQty: 100, invoiceRate: 50 },
        { itemId: item2, poQty: 200, poRate: 30, grnAcceptedQty: 150, invoiceQty: 200, invoiceRate: 30 },
      ],
      invoiceTotalAmount: 11000,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    expect(json.match_status).toBe('partial_match')
    expect(json.summary.matched).toBe(1)
    expect(json.summary.mismatched).toBe(1)
  })

  // ── GRN qty 0 → qty_match false ──
  it('flags qty_match false when GRN qty is 0', async () => {
    const invoiceId = uuid(1)
    const poId = uuid(2)
    const itemId = uuid(3)
    const grnId = uuid(4)

    const supabase = buildMatchingSupabase({
      invoiceId,
      poId,
      grnId,
      items: [
        { itemId, poQty: 100, poRate: 50, grnAcceptedQty: 0, invoiceQty: 0, invoiceRate: 50 },
      ],
      invoiceTotalAmount: 0,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ invoice_id: invoiceId }))
    const json = await res.json()

    // grnQty === 0 means qtyMatch = false (grnQty > 0 required)
    expect(json.results[0].qty_match).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════
// Test helpers
// ══════════════════════════════════════════════════════════

interface MatchItem {
  itemId: string
  poQty: number
  poRate: number
  grnAcceptedQty: number
  invoiceQty: number
  invoiceRate: number
}

interface MatchScenario {
  invoiceId: string
  poId: string
  grnId: string
  items: MatchItem[]
  invoiceTotalAmount: number
}

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

function buildMockSupabase(overrides: Record<string, unknown>) {
  const base: any = {
    from: jest.fn().mockImplementation(() => buildChain()),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
  }
  return { ...base, ...overrides }
}

function buildMatchingSupabase(scenario: MatchScenario) {
  const { invoiceId, poId, grnId, items, invoiceTotalAmount } = scenario

  const poItems = items.map(i => ({
    item_id: i.itemId,
    ordered_qty: i.poQty,
    rate: i.poRate,
  }))

  const grnItems = items.map(i => ({
    item_id: i.itemId,
    accepted_qty: i.grnAcceptedQty,
  }))

  const invoiceItems = items.map(i => ({
    item_id: i.itemId,
    quantity: i.invoiceQty,
    rate: i.invoiceRate,
  }))

  const supabase: any = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      const chain = buildChain()

      if (table === 'invoices') {
        chain.single.mockReturnValue({
          data: {
            id: invoiceId,
            po_id: poId,
            grn_id: grnId,
            total_amount: invoiceTotalAmount,
          },
          error: null,
        })
      }

      if (table === 'purchase_order_items') {
        chain.then = (resolve: (v: any) => void) => resolve({ data: poItems, error: null })
      }

      if (table === 'grns') {
        chain.then = (resolve: (v: any) => void) => resolve({
          data: [{ id: grnId, status: 'verified' }],
          error: null,
        })
      }

      if (table === 'grn_items') {
        chain.then = (resolve: (v: any) => void) => resolve({ data: grnItems, error: null })
      }

      if (table === 'invoice_items') {
        chain.then = (resolve: (v: any) => void) => resolve({ data: invoiceItems, error: null })
      }

      if (table === 'activity_log') {
        chain.then = (resolve: (v: any) => void) => resolve({ data: null, error: null })
      }

      return chain
    }),
  }

  return supabase
}
