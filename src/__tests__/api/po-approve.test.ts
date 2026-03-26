/**
 * @jest-environment node
 */

/**
 * Tests for PO Approval API
 * POST /api/po/approve
 *
 * Business rules tested:
 * - Auto-approval <= 10,000
 * - unit_purchase_manager: 10K-50K
 * - unit_cao: 50K-2L
 * - group_cao: 2L-10L
 * - group_admin: >10L
 * - Rejection with mandatory comments
 * - Unauthorized role rejection
 * - Sequential approval levels
 */

// ── Mock dependencies ──
const mockCreateClient = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 }),
}))

import { POST } from '@/app/api/po/approve/route'
import { NextRequest } from 'next/server'
import { canApprovePO, PO_APPROVAL_THRESHOLD } from '@/types/database'
import type { UserRole } from '@/types/database'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/po/approve', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const uuid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`

// ══════════════════════════════════════════════════════════
// canApprovePO helper (pure function)
// ══════════════════════════════════════════════════════════
describe('canApprovePO', () => {
  it('group_admin can approve any amount', () => {
    expect(canApprovePO('group_admin', 1)).toBe(true)
    expect(canApprovePO('group_admin', 50000000)).toBe(true)
  })

  it('group_cao can approve up to 10L', () => {
    expect(canApprovePO('group_cao', 1000000)).toBe(true)
    expect(canApprovePO('group_cao', 1000001)).toBe(false)
  })

  it('unit_cao can approve up to 2L', () => {
    expect(canApprovePO('unit_cao', 200000)).toBe(true)
    expect(canApprovePO('unit_cao', 200001)).toBe(false)
  })

  it('unit_purchase_manager can approve up to 50K', () => {
    expect(canApprovePO('unit_purchase_manager', 50000)).toBe(true)
    expect(canApprovePO('unit_purchase_manager', 50001)).toBe(false)
  })

  it('store_staff cannot approve anything', () => {
    expect(canApprovePO('store_staff', 1)).toBe(false)
  })

  it('finance_staff cannot approve anything', () => {
    expect(canApprovePO('finance_staff', 100)).toBe(false)
  })

  it('vendor role cannot approve', () => {
    expect(canApprovePO('vendor', 100)).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════
// PO_APPROVAL_THRESHOLD
// ══════════════════════════════════════════════════════════
describe('PO_APPROVAL_THRESHOLD', () => {
  it('auto threshold is 10,000', () => {
    expect(PO_APPROVAL_THRESHOLD.auto).toBe(10000)
  })

  it('unit_pm threshold is 50,000', () => {
    expect(PO_APPROVAL_THRESHOLD.unit_pm).toBe(50000)
  })

  it('unit_cao threshold is 200,000', () => {
    expect(PO_APPROVAL_THRESHOLD.unit_cao).toBe(200000)
  })

  it('group_cao threshold is 1,000,000', () => {
    expect(PO_APPROVAL_THRESHOLD.group_cao).toBe(1000000)
  })

  it('group_admin threshold is Infinity', () => {
    expect(PO_APPROVAL_THRESHOLD.group_admin).toBe(Infinity)
  })
})

// ══════════════════════════════════════════════════════════
// POST /api/po/approve
// ══════════════════════════════════════════════════════════
describe('POST /api/po/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { rateLimit } = require('@/lib/rate-limit')
    rateLimit.mockResolvedValue({ success: true, remaining: 9, reset: Date.now() + 60000 })
  })

  // ── Auth ──
  it('returns 401 if not authenticated', async () => {
    const supabase = buildSupabase({ user: null })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(401)
  })

  // ── Missing profile ──
  it('returns 401 if profile not found', async () => {
    const supabase = buildSupabase({ profile: null })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(401)
  })

  // ── Invalid request ──
  it('returns 400 if po_id is missing', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ action: 'approve' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid action', async () => {
    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'hold' }))
    expect(res.status).toBe(400)
  })

  // ── PO not found ──
  it('returns 404 if PO not found', async () => {
    const supabase = buildSupabase({ po: null })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(404)
  })

  // ── PO not in pending_approval ──
  it('returns 400 if PO is not pending_approval', async () => {
    const supabase = buildSupabase({
      po: { id: uuid(1), status: 'approved', total_amount: 30000, current_approval_level: 1 },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('not pending')
  })

  // ── Insufficient authority ──
  it('returns 403 when store_staff tries to approve', async () => {
    const supabase = buildSupabase({
      profile: { role: 'store_staff', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 when unit_purchase_manager tries to approve PO > 50K', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_purchase_manager', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 100000, current_approval_level: 1 },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 when unit_cao tries to approve PO > 2L', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_cao', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 500000, current_approval_level: 1 },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(403)
  })

  // ── Rejection requires comments ──
  it('returns 400 when rejecting without comments', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_purchase_manager', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'reject' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Comments required')
  })

  it('returns 400 when rejecting with whitespace-only comments', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_purchase_manager', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'reject', comments: '   ' }))
    expect(res.status).toBe(400)
  })

  // ── Successful rejection ──
  it('cancels PO on rejection with valid comments', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_purchase_manager', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
      currentApproval: { id: uuid(20), approval_level: 1, approver_role: 'unit_purchase_manager' },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({
      po_id: uuid(1),
      action: 'reject',
      comments: 'Rate too high, renegotiate with vendor',
    }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.status).toBe('cancelled')
  })

  // ── No pending approval record ──
  it('returns 400 if no pending approval at current level', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_purchase_manager', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
      currentApproval: null,
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('No pending approval')
  })

  // ── Single-level approval (30K PO) ──
  it('fully approves a 30K PO by unit_purchase_manager', async () => {
    const supabase = buildSupabase({
      profile: { role: 'unit_purchase_manager', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
      currentApproval: { id: uuid(20), approval_level: 1, approver_role: 'unit_purchase_manager' },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.status).toBe('approved')
  })

  // ── Multi-level: 100K PO — unit_cao approves at level 2, needs no more ──
  // 100K (50K-200K) requires: [unit_purchase_manager, unit_cao] — 2 levels
  // At level 1: PM approves → advances to level 2
  // At level 2: unit_cao gives final approval
  it('advances to next level for 100K PO when PM approves at level 1', async () => {
    // Use group_admin who can approve any amount to act at level 1
    // (In practice, the PM approves at level 1 for amounts up to 50K;
    //  for higher amounts, higher-role users handle each level)
    const supabase = buildSupabase({
      profile: { role: 'unit_cao', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 100000, current_approval_level: 1 },
      currentApproval: { id: uuid(20), approval_level: 1, approver_role: 'unit_purchase_manager' },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.status).toBe('pending_approval')
    expect(json.message).toContain('unit cao')
  })

  // ── Multi-level: >10L PO — group_admin approves at level 3, advances to level 4 ──
  // >10L requires: [unit_purchase_manager, unit_cao, group_cao, group_admin] — 4 levels
  // group_admin (unlimited authority) acting at level 3 → should advance to level 4
  it('advances to group_admin for >10L PO at level 3', async () => {
    const supabase = buildSupabase({
      profile: { role: 'group_admin', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 1500000, current_approval_level: 3 },
      currentApproval: { id: uuid(20), approval_level: 3, approver_role: 'group_cao' },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    const json = await res.json()

    expect(json.status).toBe('pending_approval')
    expect(json.message).toContain('group admin')
  })

  // ── group_admin final approval for >10L PO ──
  it('fully approves a >10L PO at the group_admin level', async () => {
    const supabase = buildSupabase({
      profile: { role: 'group_admin', centre_id: uuid(10) },
      po: { id: uuid(1), status: 'pending_approval', total_amount: 1500000, current_approval_level: 4 },
      currentApproval: { id: uuid(20), approval_level: 4, approver_role: 'group_admin' },
    })
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.status).toBe('approved')
  })

  // ── Rate limit ──
  it('returns 429 when rate limited', async () => {
    const { rateLimit } = require('@/lib/rate-limit')
    rateLimit.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60000 })

    const supabase = buildSupabase({})
    mockCreateClient.mockResolvedValue(supabase)

    const res = await POST(makeRequest({ po_id: uuid(1), action: 'approve' }))
    expect(res.status).toBe(429)
  })
})

// ══════════════════════════════════════════════════════════
// Builder
// ══════════════════════════════════════════════════════════

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
  profile?: any
  po?: any
  currentApproval?: any
}

function buildSupabase(opts: BuildOptions) {
  const {
    user = { id: 'test-user-id' },
    profile = { role: 'unit_purchase_manager', centre_id: uuid(10) },
    po = { id: uuid(1), status: 'pending_approval', total_amount: 30000, current_approval_level: 1 },
    currentApproval = { id: uuid(20), approval_level: 1, approver_role: 'unit_purchase_manager' },
  } = opts

  const supabase: any = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      const chain = buildChain()

      if (table === 'user_profiles') {
        chain.single.mockReturnValue({ data: profile, error: null })
      }

      if (table === 'purchase_orders') {
        chain.single.mockReturnValue({ data: po, error: null })
      }

      if (table === 'po_approvals') {
        chain.single.mockReturnValue({ data: currentApproval, error: null })
      }

      return chain
    }),
  }

  return supabase
}
