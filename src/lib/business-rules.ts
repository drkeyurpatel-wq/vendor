// ============================================================
// H1 VPMS — Core Business Rules (Pure Functions)
// All critical business logic extracted for testability.
// These functions have ZERO dependencies on Supabase/Next.js.
// ============================================================

// ─── Rule 1: 3-Way Match ─────────────────────────────────────
// PO qty = GRN qty = Invoice qty AND PO rate = Invoice rate
// Tolerance: ±0.5% on rate, ±2% on quantity

export const RATE_TOLERANCE = 0.005 // 0.5%
export const QTY_TOLERANCE = 0.02  // 2%

export type MatchResult = 'matched' | 'partial_match' | 'mismatch'

export interface MatchLineItem {
  item_id: string
  po_qty: number
  po_rate: number
  grn_accepted_qty: number
  invoice_qty: number
  invoice_rate: number
}

export function matchLineItem(item: MatchLineItem): { status: 'matched' | 'qty_mismatch' | 'rate_mismatch' | 'both_mismatch' } {
  const qtyDeviation = Math.abs(item.po_qty - item.invoice_qty) / Math.max(item.po_qty, 1)
  const rateDeviation = Math.abs(item.po_rate - item.invoice_rate) / Math.max(item.po_rate, 1)
  const grnQtyDeviation = Math.abs(item.grn_accepted_qty - item.invoice_qty) / Math.max(item.grn_accepted_qty, 1)

  const qtyOk = qtyDeviation <= QTY_TOLERANCE && grnQtyDeviation <= QTY_TOLERANCE
  const rateOk = rateDeviation <= RATE_TOLERANCE

  if (qtyOk && rateOk) return { status: 'matched' }
  if (!qtyOk && !rateOk) return { status: 'both_mismatch' }
  if (!qtyOk) return { status: 'qty_mismatch' }
  return { status: 'rate_mismatch' }
}

export function computeMatchStatus(items: MatchLineItem[]): MatchResult {
  if (items.length === 0) return 'mismatch'
  const results = items.map(matchLineItem)
  const allMatched = results.every(r => r.status === 'matched')
  const anyMatched = results.some(r => r.status === 'matched')
  if (allMatched) return 'matched'
  if (anyMatched) return 'partial_match'
  return 'mismatch'
}

// ─── Rule 2: Credit Period from GRN Date ─────────────────────
// Credit period clock starts from GRN date, NOT invoice date.
// due_date = grn_date + vendor.credit_period_days

export function calculateDueDate(grnDate: string, creditPeriodDays: number): string {
  const d = new Date(grnDate)
  d.setDate(d.getDate() + creditPeriodDays)
  return d.toISOString().split('T')[0]
}

export function isDueDateCorrect(
  dueDate: string,
  grnDate: string,
  creditPeriodDays: number,
): boolean {
  const expected = calculateDueDate(grnDate, creditPeriodDays)
  return dueDate === expected
}

// ─── Rule 3: Saturday Payment Cycle ──────────────────────────
// All vendor payments are batched on Saturdays only.

export function isSaturday(dateStr: string): boolean {
  return new Date(dateStr).getDay() === 6
}

export function getNextSaturday(fromDate: string = new Date().toISOString()): string {
  const d = new Date(fromDate)
  const day = d.getDay()
  const daysUntilSat = (6 - day + 7) % 7 || 7 // if already Saturday, next one
  d.setDate(d.getDate() + daysUntilSat)
  return d.toISOString().split('T')[0]
}

export function isValidPaymentBatchDate(batchDate: string): { valid: boolean; message: string } {
  if (!isSaturday(batchDate)) {
    return { valid: false, message: `Payment batch date ${batchDate} is not a Saturday` }
  }
  return { valid: true, message: 'Valid Saturday payment date' }
}

// ─── Rule 4: No PO = No Payment ─────────────────────────────
// Invoices without a linked PO must be flagged.

export function validateInvoicePOLink(poId: string | null): { valid: boolean; flag: string | null } {
  if (!poId) {
    return { valid: false, flag: 'NO_PO_LINKED' }
  }
  return { valid: true, flag: null }
}

// ─── Rule 5: Rate Contract Tolerance ─────────────────────────
// If active rate contract exists, PO rate must match ±0.5%.

export function validateRateAgainstContract(
  proposedRate: number,
  contractRate: number,
): { valid: boolean; deviationPercent: number; message: string } {
  if (contractRate <= 0) {
    return { valid: true, deviationPercent: 0, message: 'No contract rate to compare' }
  }
  const deviation = Math.abs(proposedRate - contractRate) / contractRate
  const deviationPercent = Math.round(deviation * 10000) / 100 // 2 decimal places

  if (deviation <= RATE_TOLERANCE) {
    return { valid: true, deviationPercent, message: 'Within ±0.5% tolerance' }
  }
  return {
    valid: false,
    deviationPercent,
    message: `Rate deviates ${deviationPercent}% from contract rate ₹${contractRate} (tolerance: ±0.5%)`,
  }
}

// ─── Rule 6: Duplicate Invoice Check ─────────────────────────
// vendor_id + vendor_invoice_no must be unique.

export function isDuplicateInvoice(
  vendorId: string,
  vendorInvoiceNo: string,
  existingInvoices: Array<{ vendor_id: string; vendor_invoice_no: string }>,
): boolean {
  return existingInvoices.some(
    inv => inv.vendor_id === vendorId && inv.vendor_invoice_no === vendorInvoiceNo
  )
}

// ─── Rule 7: L1 Vendor Auto-Selection ────────────────────────
// Reorder triggers must select L1 vendor from active rate contract.

export interface RankedVendor {
  vendor_id: string
  rate: number
  l_rank: number
}

export function selectL1Vendor(rankedVendors: RankedVendor[]): RankedVendor | null {
  if (rankedVendors.length === 0) return null
  const sorted = [...rankedVendors].sort((a, b) => a.l_rank - b.l_rank)
  return sorted[0]
}

// ─── Rule 8: Approval Thresholds ─────────────────────────────
// Already in types/database.ts as canApprovePO — re-exported here for completeness.

export const APPROVAL_THRESHOLDS = [
  { role: 'unit_purchase_manager', maxAmount: 50000 },
  { role: 'unit_cao', maxAmount: 200000 },
  { role: 'group_cao', maxAmount: 1000000 },
  { role: 'group_admin', maxAmount: Infinity },
] as const

export function getRequiredApprovalRole(amount: number): string {
  for (const tier of APPROVAL_THRESHOLDS) {
    if (amount <= tier.maxAmount) return tier.role
  }
  return 'group_admin'
}

// ─── Rule 9: Blacklist Requires group_admin ──────────────────
// Only Keyur (group_admin) can blacklist a vendor.

export function canBlacklistVendor(role: string): boolean {
  return role === 'group_admin'
}

export function canChangeVendorStatus(
  role: string,
  newStatus: string,
): { allowed: boolean; message: string } {
  if (newStatus === 'blacklisted' && !canBlacklistVendor(role)) {
    return { allowed: false, message: 'Only group admin can blacklist vendors' }
  }
  // under_review requires at least unit_cao
  if (newStatus === 'under_review' && !['group_admin', 'group_cao', 'unit_cao'].includes(role)) {
    return { allowed: false, message: 'Insufficient permissions to put vendor under review' }
  }
  return { allowed: true, message: 'Allowed' }
}

// ─── Rule 10: Auto-numbering ─────────────────────────────────
// Consistent format across all document types.

export function generateDocNumber(
  type: 'PO' | 'GRN' | 'IND' | 'INV' | 'BATCH',
  centreCode: string,
  yearMonth: string, // 'YYMM' format
  sequence: number,
): string {
  const seq = String(sequence).padStart(3, '0')
  return `H1-${centreCode}-${type}-${yearMonth}-${seq}`
}
