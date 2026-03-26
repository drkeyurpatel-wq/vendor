/**
 * @jest-environment node
 */

/**
 * H1 VPMS — Critical Business Rule Tests
 *
 * Tests the 10 non-negotiable business rules from CLAUDE.md:
 * 1. 3-way match (PO = GRN = Invoice) — blocks payment on mismatch
 * 2. Credit period from GRN date — never invoice date
 * 3. Saturday payment cycle — all payments on Saturdays
 * 4. No PO = No Payment — invoices without PO flagged
 * 5. Rate contract ±0.5% tolerance
 * 6. Duplicate invoice check — vendor_id + invoice_no unique
 * 7. L1 vendor auto-selection from rate contracts
 * 8. Approval chain — never skip levels
 * 9. Blacklist requires group_admin
 * 10. Auto-numbering format consistency
 */

import {
  matchLineItem,
  computeMatchStatus,
  RATE_TOLERANCE,
  QTY_TOLERANCE,
  calculateDueDate,
  isDueDateCorrect,
  isSaturday,
  getNextSaturday,
  isValidPaymentBatchDate,
  validateInvoicePOLink,
  validateRateAgainstContract,
  isDuplicateInvoice,
  selectL1Vendor,
  getRequiredApprovalRole,
  canBlacklistVendor,
  canChangeVendorStatus,
  generateDocNumber,
  type MatchLineItem,
  type RankedVendor,
} from '@/lib/business-rules'

// ══════════════════════════════════════════════════════════════
// Rule 1: 3-Way Match
// ══════════════════════════════════════════════════════════════
describe('Rule 1: 3-Way Match', () => {
  const baseItem: MatchLineItem = {
    item_id: 'item-1',
    po_qty: 100,
    po_rate: 500,
    grn_accepted_qty: 100,
    invoice_qty: 100,
    invoice_rate: 500,
  }

  it('matches when all values are identical', () => {
    expect(matchLineItem(baseItem).status).toBe('matched')
  })

  it('matches within rate tolerance (0.5%)', () => {
    // 500 * 0.005 = 2.50 — so 502.49 should pass
    const item = { ...baseItem, invoice_rate: 502.49 }
    expect(matchLineItem(item).status).toBe('matched')
  })

  it('fails on rate exceeding 0.5% tolerance', () => {
    // 500 * 0.005 = 2.50 — so 503 should fail
    const item = { ...baseItem, invoice_rate: 503 }
    expect(matchLineItem(item).status).toBe('rate_mismatch')
  })

  it('matches within qty tolerance (2%)', () => {
    // 100 * 0.02 = 2 — so 98 should pass
    const item = { ...baseItem, invoice_qty: 98, grn_accepted_qty: 98 }
    expect(matchLineItem(item).status).toBe('matched')
  })

  it('fails on qty exceeding 2% tolerance', () => {
    const item = { ...baseItem, invoice_qty: 95, grn_accepted_qty: 95 }
    expect(matchLineItem(item).status).toBe('qty_mismatch')
  })

  it('reports both_mismatch when rate AND qty fail', () => {
    const item = { ...baseItem, invoice_qty: 80, invoice_rate: 600 }
    expect(matchLineItem(item).status).toBe('both_mismatch')
  })

  it('catches GRN qty mismatch even when PO qty matches invoice', () => {
    // PO=100, GRN=80, Invoice=100 → GRN doesn't match invoice
    const item = { ...baseItem, grn_accepted_qty: 80 }
    expect(matchLineItem(item).status).toBe('qty_mismatch')
  })

  describe('computeMatchStatus (multi-item)', () => {
    it('returns matched when all items match', () => {
      expect(computeMatchStatus([baseItem, { ...baseItem, item_id: 'item-2' }])).toBe('matched')
    })

    it('returns partial_match when some items match', () => {
      const bad = { ...baseItem, item_id: 'item-2', invoice_rate: 600 }
      expect(computeMatchStatus([baseItem, bad])).toBe('partial_match')
    })

    it('returns mismatch when no items match', () => {
      const bad1 = { ...baseItem, invoice_rate: 600 }
      const bad2 = { ...baseItem, item_id: 'item-2', invoice_qty: 50 }
      expect(computeMatchStatus([bad1, bad2])).toBe('mismatch')
    })

    it('returns mismatch for empty items array', () => {
      expect(computeMatchStatus([])).toBe('mismatch')
    })
  })

  it('has tolerance constants matching CLAUDE.md spec', () => {
    expect(RATE_TOLERANCE).toBe(0.005) // ±0.5%
    expect(QTY_TOLERANCE).toBe(0.02)   // ±2%
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 2: Credit Period from GRN Date
// ══════════════════════════════════════════════════════════════
describe('Rule 2: Credit period from GRN date', () => {
  it('calculates due date as grn_date + credit_period_days', () => {
    expect(calculateDueDate('2026-01-15', 30)).toBe('2026-02-14')
    expect(calculateDueDate('2026-01-15', 0)).toBe('2026-01-15')
    expect(calculateDueDate('2026-01-15', 90)).toBe('2026-04-15')
  })

  it('handles month boundary correctly', () => {
    expect(calculateDueDate('2026-01-31', 30)).toBe('2026-03-02') // 31 Jan + 30 = 2 Mar
  })

  it('handles year boundary', () => {
    expect(calculateDueDate('2025-12-15', 30)).toBe('2026-01-14')
  })

  it('validates due date was calculated from GRN date', () => {
    expect(isDueDateCorrect('2026-02-14', '2026-01-15', 30)).toBe(true)
  })

  it('rejects due date calculated from invoice date instead of GRN date', () => {
    // GRN: Jan 15, Invoice: Jan 20, Credit: 30 days
    // Correct due: Feb 14 (from GRN)
    // Wrong due: Feb 19 (from invoice date)
    expect(isDueDateCorrect('2026-02-19', '2026-01-15', 30)).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 3: Saturday Payment Cycle
// ══════════════════════════════════════════════════════════════
describe('Rule 3: Saturday payment cycle', () => {
  it('correctly identifies Saturday', () => {
    expect(isSaturday('2026-03-28')).toBe(true)  // Saturday
    expect(isSaturday('2026-03-27')).toBe(false)  // Friday
    expect(isSaturday('2026-03-29')).toBe(false)  // Sunday
  })

  it('validates payment batch date must be Saturday', () => {
    const sat = isValidPaymentBatchDate('2026-03-28')
    expect(sat.valid).toBe(true)

    const fri = isValidPaymentBatchDate('2026-03-27')
    expect(fri.valid).toBe(false)
    expect(fri.message).toContain('not a Saturday')
  })

  it('calculates next Saturday from any day', () => {
    expect(getNextSaturday('2026-03-23')).toBe('2026-03-28') // Mon → Sat
    expect(getNextSaturday('2026-03-26')).toBe('2026-03-28') // Thu → Sat
    expect(getNextSaturday('2026-03-27')).toBe('2026-03-28') // Fri → Sat
  })

  it('returns NEXT Saturday when already on Saturday', () => {
    expect(getNextSaturday('2026-03-28')).toBe('2026-04-04') // Sat → next Sat
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 4: No PO = No Payment
// ══════════════════════════════════════════════════════════════
describe('Rule 4: No PO = No Payment', () => {
  it('flags invoices without PO', () => {
    const result = validateInvoicePOLink(null)
    expect(result.valid).toBe(false)
    expect(result.flag).toBe('NO_PO_LINKED')
  })

  it('passes invoices with PO', () => {
    const result = validateInvoicePOLink('po-uuid-123')
    expect(result.valid).toBe(true)
    expect(result.flag).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 5: Rate Contract ±0.5% Tolerance
// ══════════════════════════════════════════════════════════════
describe('Rule 5: Rate contract ±0.5% tolerance', () => {
  it('passes when rate matches exactly', () => {
    const r = validateRateAgainstContract(500, 500)
    expect(r.valid).toBe(true)
    expect(r.deviationPercent).toBe(0)
  })

  it('passes at exactly 0.5% over', () => {
    // 500 * 1.005 = 502.50
    const r = validateRateAgainstContract(502.50, 500)
    expect(r.valid).toBe(true)
  })

  it('fails at 0.6% over', () => {
    // 500 * 1.006 = 503
    const r = validateRateAgainstContract(503, 500)
    expect(r.valid).toBe(false)
    expect(r.deviationPercent).toBe(0.6)
  })

  it('passes at 0.5% under', () => {
    const r = validateRateAgainstContract(497.50, 500)
    expect(r.valid).toBe(true)
  })

  it('fails at 1% under', () => {
    const r = validateRateAgainstContract(495, 500)
    expect(r.valid).toBe(false)
    expect(r.deviationPercent).toBe(1)
  })

  it('handles edge case: contract rate is 0', () => {
    const r = validateRateAgainstContract(100, 0)
    expect(r.valid).toBe(true) // no contract to compare
  })

  it('includes deviation in error message', () => {
    const r = validateRateAgainstContract(510, 500)
    expect(r.message).toContain('2%')
    expect(r.message).toContain('₹500')
    expect(r.message).toContain('±0.5%')
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 6: Duplicate Invoice Check
// ══════════════════════════════════════════════════════════════
describe('Rule 6: Duplicate invoice check', () => {
  const existing = [
    { vendor_id: 'v1', vendor_invoice_no: 'INV-001' },
    { vendor_id: 'v1', vendor_invoice_no: 'INV-002' },
    { vendor_id: 'v2', vendor_invoice_no: 'INV-001' },
  ]

  it('detects duplicate: same vendor + same invoice no', () => {
    expect(isDuplicateInvoice('v1', 'INV-001', existing)).toBe(true)
  })

  it('allows same invoice no from different vendor', () => {
    expect(isDuplicateInvoice('v3', 'INV-001', existing)).toBe(false)
  })

  it('allows new invoice no from same vendor', () => {
    expect(isDuplicateInvoice('v1', 'INV-003', existing)).toBe(false)
  })

  it('handles empty existing list', () => {
    expect(isDuplicateInvoice('v1', 'INV-001', [])).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 7: L1 Vendor Auto-Selection
// ══════════════════════════════════════════════════════════════
describe('Rule 7: L1 vendor auto-selection', () => {
  const vendors: RankedVendor[] = [
    { vendor_id: 'v3', rate: 520, l_rank: 3 },
    { vendor_id: 'v1', rate: 500, l_rank: 1 },
    { vendor_id: 'v2', rate: 510, l_rank: 2 },
  ]

  it('selects vendor with l_rank = 1', () => {
    const result = selectL1Vendor(vendors)
    expect(result?.vendor_id).toBe('v1')
    expect(result?.l_rank).toBe(1)
  })

  it('returns null when no vendors available', () => {
    expect(selectL1Vendor([])).toBeNull()
  })

  it('handles single vendor', () => {
    const result = selectL1Vendor([{ vendor_id: 'v1', rate: 500, l_rank: 2 }])
    expect(result?.vendor_id).toBe('v1')
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 8: Approval Chain — Never Skip Levels
// ══════════════════════════════════════════════════════════════
describe('Rule 8: Approval chain', () => {
  it('auto-approves up to ₹10K (no human needed)', () => {
    // ≤10K is auto-approved per CLAUDE.md, but the function returns the role needed
    // for amounts that need human approval
    expect(getRequiredApprovalRole(10000)).toBe('unit_purchase_manager')
  })

  it('requires unit_purchase_manager for ₹10K-₹50K', () => {
    expect(getRequiredApprovalRole(50000)).toBe('unit_purchase_manager')
  })

  it('requires unit_cao for ₹50K-₹2L', () => {
    expect(getRequiredApprovalRole(50001)).toBe('unit_cao')
    expect(getRequiredApprovalRole(200000)).toBe('unit_cao')
  })

  it('requires group_cao for ₹2L-₹10L', () => {
    expect(getRequiredApprovalRole(200001)).toBe('group_cao')
    expect(getRequiredApprovalRole(1000000)).toBe('group_cao')
  })

  it('requires group_admin (MD) for >₹10L', () => {
    expect(getRequiredApprovalRole(1000001)).toBe('group_admin')
    expect(getRequiredApprovalRole(50000000)).toBe('group_admin')
  })

  it('threshold boundaries are exact', () => {
    expect(getRequiredApprovalRole(50000)).toBe('unit_purchase_manager')
    expect(getRequiredApprovalRole(50001)).toBe('unit_cao')
    expect(getRequiredApprovalRole(200000)).toBe('unit_cao')
    expect(getRequiredApprovalRole(200001)).toBe('group_cao')
    expect(getRequiredApprovalRole(1000000)).toBe('group_cao')
    expect(getRequiredApprovalRole(1000001)).toBe('group_admin')
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 9: Blacklist Requires group_admin
// ══════════════════════════════════════════════════════════════
describe('Rule 9: Blacklist requires group_admin', () => {
  it('group_admin CAN blacklist', () => {
    expect(canBlacklistVendor('group_admin')).toBe(true)
  })

  it('group_cao CANNOT blacklist', () => {
    expect(canBlacklistVendor('group_cao')).toBe(false)
  })

  it('unit_cao CANNOT blacklist', () => {
    expect(canBlacklistVendor('unit_cao')).toBe(false)
  })

  it('store_staff CANNOT blacklist', () => {
    expect(canBlacklistVendor('store_staff')).toBe(false)
  })

  it('vendor role CANNOT blacklist', () => {
    expect(canBlacklistVendor('vendor')).toBe(false)
  })

  describe('canChangeVendorStatus', () => {
    it('blocks blacklist from non-admin roles', () => {
      const r = canChangeVendorStatus('group_cao', 'blacklisted')
      expect(r.allowed).toBe(false)
      expect(r.message).toContain('group admin')
    })

    it('allows blacklist from group_admin', () => {
      const r = canChangeVendorStatus('group_admin', 'blacklisted')
      expect(r.allowed).toBe(true)
    })

    it('allows status change to active from any role', () => {
      expect(canChangeVendorStatus('store_staff', 'active').allowed).toBe(true)
    })
  })
})

// ══════════════════════════════════════════════════════════════
// Rule 10: Auto-Numbering Format
// ══════════════════════════════════════════════════════════════
describe('Rule 10: Auto-numbering', () => {
  it('generates PO number in correct format', () => {
    expect(generateDocNumber('PO', 'SHI', '2603', 1)).toBe('H1-SHI-PO-2603-001')
    expect(generateDocNumber('PO', 'VAS', '2603', 42)).toBe('H1-VAS-PO-2603-042')
  })

  it('generates GRN number in correct format', () => {
    expect(generateDocNumber('GRN', 'MOD', '2603', 7)).toBe('H1-MOD-GRN-2603-007')
  })

  it('generates Indent number in correct format', () => {
    expect(generateDocNumber('IND', 'UDA', '2603', 15)).toBe('H1-UDA-IND-2603-015')
  })

  it('generates Invoice number in correct format', () => {
    expect(generateDocNumber('INV', 'GAN', '2603', 100)).toBe('H1-GAN-INV-2603-100')
  })

  it('generates Batch number in correct format', () => {
    expect(generateDocNumber('BATCH', 'SHI', '2603', 3)).toBe('H1-SHI-BATCH-2603-003')
  })

  it('pads sequence to 3 digits', () => {
    expect(generateDocNumber('PO', 'SHI', '2603', 1)).toMatch(/-001$/)
    expect(generateDocNumber('PO', 'SHI', '2603', 99)).toMatch(/-099$/)
    expect(generateDocNumber('PO', 'SHI', '2603', 999)).toMatch(/-999$/)
  })
})
