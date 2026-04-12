import {
  formatCurrency,
  formatLakhs,
  formatDate,
  formatDateTime,
  timeAgo,
  isOverdue,
  getDueDateStatus,
  generateVendorCode,
  generateItemCode,
  generatePONumber,
  generateGRNNumber,
  generateIndentNumber,
  VENDOR_STATUS_COLORS,
  PO_STATUS_COLORS,
  MATCH_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
} from '@/lib/utils'

// ──────────────────────────────────────────────────────────
// formatCurrency
// ──────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00')
  })

  it('formats small amounts in INR style', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1,500')
    expect(result).toContain('₹')
  })

  it('formats lakhs with Indian grouping', () => {
    const result = formatCurrency(250000)
    expect(result).toContain('2,50,000')
  })

  it('formats crores', () => {
    const result = formatCurrency(12500000)
    expect(result).toContain('1,25,00,000')
  })

  it('formats with 2 decimal places', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1,234.56')
  })

  it('handles negative amounts', () => {
    const result = formatCurrency(-5000)
    expect(result).toContain('5,000')
    expect(result).toContain('-')
  })
})

// ──────────────────────────────────────────────────────────
// formatLakhs
// ──────────────────────────────────────────────────────────
describe('formatLakhs', () => {
  it('shows plain rupees for amounts under 1K', () => {
    expect(formatLakhs(500)).toBe('₹500.00')
  })

  it('shows K for thousands', () => {
    expect(formatLakhs(5000)).toBe('₹5.00 K')
  })

  it('shows L for lakhs', () => {
    expect(formatLakhs(250000)).toBe('₹2.50 L')
  })

  it('shows Cr for crores', () => {
    expect(formatLakhs(15000000)).toBe('₹1.50 Cr')
  })

  it('boundary: exactly 1000', () => {
    expect(formatLakhs(1000)).toBe('₹1.00 K')
  })

  it('boundary: exactly 100000', () => {
    expect(formatLakhs(100000)).toBe('₹1.00 L')
  })

  it('boundary: exactly 10000000', () => {
    expect(formatLakhs(10000000)).toBe('₹1.00 Cr')
  })
})

// ──────────────────────────────────────────────────────────
// formatDate / formatDateTime
// ──────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats ISO string', () => {
    expect(formatDate('2025-03-15')).toBe('15 Mar 2025')
  })

  it('formats Date object', () => {
    expect(formatDate(new Date(2025, 0, 1))).toBe('01 Jan 2025')
  })
})

describe('formatDateTime', () => {
  it('includes time with AM/PM', () => {
    const result = formatDateTime('2025-06-15T14:30:00')
    expect(result).toContain('15 Jun 2025')
    expect(result).toMatch(/2:30\s*PM/i)
  })
})

// ──────────────────────────────────────────────────────────
// timeAgo
// ──────────────────────────────────────────────────────────
describe('timeAgo', () => {
  it('returns "ago" suffix', () => {
    const recent = new Date(Date.now() - 60 * 1000).toISOString() // 1 min ago
    const result = timeAgo(recent)
    expect(result).toContain('ago')
  })

  it('handles old dates', () => {
    const result = timeAgo('2020-01-01')
    expect(result).toContain('ago')
  })
})

// ──────────────────────────────────────────────────────────
// isOverdue
// ──────────────────────────────────────────────────────────
describe('isOverdue', () => {
  it('returns true for past date', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
  })

  it('returns false for future date', () => {
    expect(isOverdue('2099-12-31')).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// getDueDateStatus
// ──────────────────────────────────────────────────────────
describe('getDueDateStatus', () => {
  it('returns "overdue" for past dates', () => {
    expect(getDueDateStatus('2020-01-01')).toBe('overdue')
  })

  it('returns "critical" when due within 3 days', () => {
    const twoDaysOut = new Date()
    twoDaysOut.setDate(twoDaysOut.getDate() + 2)
    expect(getDueDateStatus(twoDaysOut.toISOString())).toBe('critical')
  })

  it('returns "warning" when due within 7 days', () => {
    const fiveDaysOut = new Date()
    fiveDaysOut.setDate(fiveDaysOut.getDate() + 5)
    expect(getDueDateStatus(fiveDaysOut.toISOString())).toBe('warning')
  })

  it('returns "ok" for dates far in the future', () => {
    expect(getDueDateStatus('2099-12-31')).toBe('ok')
  })
})

// ──────────────────────────────────────────────────────────
// Auto-numbering generators
// ──────────────────────────────────────────────────────────
describe('generateVendorCode', () => {
  it('pads to 4 digits', () => {
    expect(generateVendorCode(1)).toBe('H1V-0001')
    expect(generateVendorCode(42)).toBe('H1V-0042')
    expect(generateVendorCode(9999)).toBe('H1V-9999')
  })

  it('handles 5+ digit sequences', () => {
    expect(generateVendorCode(10000)).toBe('H1V-10000')
  })
})

describe('generateItemCode', () => {
  it('pads to 5 digits', () => {
    expect(generateItemCode(1)).toBe('H1I-00001')
    expect(generateItemCode(123)).toBe('H1I-00123')
    expect(generateItemCode(99999)).toBe('H1I-99999')
  })
})

describe('generatePONumber', () => {
  it('includes centre code and padded sequence', () => {
    const result = generatePONumber('SHI', 1)
    expect(result).toMatch(/^H1-SHI-PO-\d{4}-001$/)
  })

  it('uses current YYMM', () => {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const result = generatePONumber('VAS', 5)
    expect(result).toContain(`${yy}${mm}`)
  })
})

describe('generateGRNNumber', () => {
  it('includes centre code and padded sequence', () => {
    const result = generateGRNNumber('MOD', 12)
    expect(result).toMatch(/^H1-MOD-GRN-\d{4}-012$/)
  })
})

describe('generateIndentNumber', () => {
  it('includes centre code with IND prefix', () => {
    const result = generateIndentNumber('UDA', 3)
    expect(result).toMatch(/^H1-UDA-IND-\d{4}-003$/)
  })
})

// ──────────────────────────────────────────────────────────
// Status color maps
// ──────────────────────────────────────────────────────────
describe('VENDOR_STATUS_COLORS', () => {
  it('has all vendor statuses', () => {
    expect(VENDOR_STATUS_COLORS).toHaveProperty('pending')
    expect(VENDOR_STATUS_COLORS).toHaveProperty('active')
    expect(VENDOR_STATUS_COLORS).toHaveProperty('inactive')
    expect(VENDOR_STATUS_COLORS).toHaveProperty('blacklisted')
    expect(VENDOR_STATUS_COLORS).toHaveProperty('under_review')
  })

  it('pending is yellow', () => {
    expect(VENDOR_STATUS_COLORS.pending).toContain('yellow')
  })

  it('active is green', () => {
    expect(VENDOR_STATUS_COLORS.active).toContain('green')
  })

  it('blacklisted is red', () => {
    expect(VENDOR_STATUS_COLORS.blacklisted).toContain('red')
  })
})

describe('PO_STATUS_COLORS', () => {
  it('has all PO statuses', () => {
    const expected = [
      'draft', 'pending_approval', 'approved', 'sent_to_vendor',
      'partially_received', 'fully_received', 'cancelled', 'closed',
    ]
    for (const status of expected) {
      expect(PO_STATUS_COLORS).toHaveProperty(status)
    }
  })

  it('draft is gray', () => {
    expect(PO_STATUS_COLORS.draft).toContain('gray')
  })

  it('approved is blue', () => {
    expect(PO_STATUS_COLORS.approved).toContain('blue')
  })

  it('cancelled is red', () => {
    expect(PO_STATUS_COLORS.cancelled).toContain('red')
  })
})

describe('MATCH_STATUS_COLORS', () => {
  it('matched is green', () => {
    expect(MATCH_STATUS_COLORS.matched).toContain('green')
  })

  it('partial_match is yellow', () => {
    expect(MATCH_STATUS_COLORS.partial_match).toContain('yellow')
  })

  it('mismatch is red', () => {
    expect(MATCH_STATUS_COLORS.mismatch).toContain('red')
  })
})

describe('PAYMENT_STATUS_COLORS', () => {
  it('unpaid is red', () => {
    expect(PAYMENT_STATUS_COLORS.unpaid).toContain('red')
  })

  it('paid is green', () => {
    expect(PAYMENT_STATUS_COLORS.paid).toContain('green')
  })

  it('disputed is orange', () => {
    expect(PAYMENT_STATUS_COLORS.disputed).toContain('orange')
  })
})
