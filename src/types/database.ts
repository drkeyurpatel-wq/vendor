// ============================================================
// H1 VPMS — Domain types.
//
// TABLE SHAPES ARE NOT DEFINED HERE. They are aliases onto the
// generated types in ./supabase.ts, which are produced from the
// LIVE database schema.
//
// This file previously hand-declared every table. Those hand-written
// interfaces drifted from the database and declared ~90 columns that
// do not exist (InvoiceItem.gst_percent, PurchaseOrderItem.cancelled_qty,
// RateContractItem.min_qty, Invoice.cgst_amount_split, and a `tenant_id`
// on most tables). Code written against them compiled cleanly and then
// failed at runtime, silently, in production.
//
// Do not reintroduce hand-written table interfaces here.
// Run `npm run gen:types` instead.
// ============================================================

import type { Tables } from './supabase'

// ─── Table row aliases (generated source of truth) ──────────
export type Centre = Tables<'centres'>
/** A user_profiles row, optionally with its centre embedded via a join. */
export type UserProfile = Tables<'user_profiles'> & {
  centre?: Pick<Tables<'centres'>, 'id' | 'code' | 'name'> | null
}
export type VendorCategory = Tables<'vendor_categories'>
export type Vendor = Tables<'vendors'>
export type ItemCategory = Tables<'item_categories'>
export type Item = Tables<'items'>
export type ItemCentreStock = Tables<'item_centre_stock'>
export type PurchaseOrder = Tables<'purchase_orders'>
export type PurchaseOrderItem = Tables<'purchase_order_items'>
export type GRN = Tables<'grns'>
export type GRNItem = Tables<'grn_items'>
export type GRNReturn = Tables<'grn_returns'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'invoice_items'>
export type DebitNote = Tables<'debit_notes'>
export type CreditNote = Tables<'credit_notes'>
export type BatchStock = Tables<'batch_stock'>
export type StockTransfer = Tables<'stock_transfers'>
export type StockTransferItem = Tables<'stock_transfer_items'>
export type RateContract = Tables<'rate_contracts'>
export type RateContractItem = Tables<'rate_contract_items'>
export type VendorPerformance = Tables<'vendor_performance'>
export type ActivityLog = Tables<'activity_log'>
export type PurchaseIndent = Tables<'purchase_indents'>

// ─── Enums, labels and business rules ───────────────────────

export type UserRole =
  | 'group_admin'
  | 'group_cao'
  | 'unit_cao'
  | 'unit_purchase_manager'
  | 'store_staff'
  | 'finance_staff'
  | 'vendor'

export type VendorStatus = 'pending' | 'active' | 'inactive' | 'blacklisted' | 'under_review'
export type VendorType = 'manufacturer' | 'distributor' | 'dealer' | 'importer' | 'service_provider' | 'c_and_f'
export type MSMECategory = 'micro' | 'small' | 'medium'
export type PaymentMode = 'neft' | 'rtgs' | 'imps' | 'cheque' | 'upi' | 'dd' | 'cash'

export type ItemDepartment = 'Medical' | 'Surgical' | 'Dental' | 'Lab' | 'Radiology' | 'Dietary' | 'Housekeeping' | 'Engineering' | 'IT' | 'General'
export type ItemType = 'drug' | 'consumable' | 'surgical' | 'implant' | 'equipment' | 'reagent' | 'linen' | 'stationery' | 'food' | 'other'
export type ABCClass = 'A' | 'B' | 'C'
export type VEDClass = 'V' | 'E' | 'D'
export type FSNClass = 'F' | 'S' | 'N'
export type GSTSlab = '0' | '5' | '12' | '18' | '28'

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent_to_vendor' | 'partially_received' | 'fully_received' | 'short_closed' | 'cancelled' | 'closed'
export type POPriority = 'low' | 'normal' | 'urgent' | 'emergency'
export type GRNStatus = 'draft' | 'submitted' | 'verified' | 'discrepancy'
export type QCStatus = 'pending' | 'under_qc' | 'approved' | 'rejected' | 'partial_approved'
export type QCItemStatus = 'pending' | 'approved' | 'rejected' | 'under_review'

export type InvoiceStatus = 'pending' | 'approved' | 'rejected' | 'disputed'
export type MatchStatus = 'pending' | 'matched' | 'partial_match' | 'mismatch'
export type LineMatchStatus = 'matched' | 'qty_mismatch' | 'rate_mismatch' | 'both_mismatch' | 'pending'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'disputed' | 'on_hold'
export type SupplyType = 'intra_state' | 'inter_state'

export type ReturnReason = 'damaged' | 'expired' | 'wrong_item' | 'quality_fail' | 'excess' | 'short_expiry' | 'other'
export type DebitNoteReason = 'goods_return' | 'rate_difference' | 'quality_issue' | 'shortage' | 'damaged' | 'other'
export type CreditNoteReason = 'rate_revision' | 'additional_discount' | 'scheme_credit' | 'advance_payment' | 'other'

export type TransferStatus = 'draft' | 'approved' | 'in_transit' | 'received' | 'partial_received' | 'cancelled'
export type VerificationType = 'full' | 'cycle_count' | 'random' | 'expiry_check'
export type StockAlertLevel = 'out_of_stock' | 'critical' | 'reorder' | 'ok'
export type ExpiryAlertLevel = 'expired' | 'expiring_30_days' | 'expiring_90_days' | 'expiring_180_days' | 'ok'


// ─── Core Entities ────────────────────────────────────────




// ─── Vendor ───────────────────────────────────────────────







// ─── Item ─────────────────────────────────────────────────





// ─── Purchase Orders ──────────────────────────────────────





// ─── GRN ──────────────────────────────────────────────────





// ─── Finance ──────────────────────────────────────────────







// ─── Inventory ────────────────────────────────────────────






// ─── Views ────────────────────────────────────────────────





// ─── Rate Contracts ──────────────────────────────────────

export type RateContractStatus = 'draft' | 'active' | 'expired' | 'terminated'
export type RateContractType = 'annual' | 'quarterly' | 'spot'



// ─── Vendor Performance ──────────────────────────────────


// ─── Activity Log ────────────────────────────────────────


// ─── Existing types kept for backward compatibility ───────



// ─── Role permission helpers ──────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  group_admin: 'Group Admin',
  group_cao: 'Group CAO',
  unit_cao: 'Unit CAO',
  unit_purchase_manager: 'Purchase Manager',
  store_staff: 'Store Staff',
  finance_staff: 'Finance Staff',
  vendor: 'Vendor',
}

export const isGroupLevel = (role: UserRole) =>
  ['group_admin', 'group_cao'].includes(role)

export const canApprovePO = (role: UserRole, amount: number): boolean => {
  if (role === 'group_admin') return true
  if (role === 'group_cao' && amount <= 1000000) return true
  if (role === 'unit_cao' && amount <= 200000) return true
  if (role === 'unit_purchase_manager' && amount <= 50000) return true
  return false
}

export const PO_APPROVAL_THRESHOLD = {
  auto: 10000,
  unit_pm: 50000,
  unit_cao: 200000,
  group_cao: 1000000,
  group_admin: Infinity,
}

// Unit conversion helper
export function convertUnits(item: Item, qty: number, fromUnit: string, toUnit: string): number {
  // Build conversion map: unit -> base (issue unit) multiplier
  const units: { unit: string; multiplier: number }[] = []

  if (item.level3_unit) {
    units.push({ unit: item.level3_unit, multiplier: 1 })
  }
  if (item.level2_unit && item.level2_qty_per_unit) {
    const l3mult = item.level3_qty_per_unit || 1
    units.push({ unit: item.level2_unit, multiplier: l3mult })
  }
  if (item.level1_unit && item.level1_qty_per_unit) {
    const l2mult = (item.level2_qty_per_unit || 1) * (item.level3_qty_per_unit || 1)
    units.push({ unit: item.level1_unit, multiplier: l2mult })
  }

  // Fallback: base unit
  if (units.length === 0) {
    units.push({ unit: item.unit, multiplier: 1 })
  }

  const fromDef = units.find(u => u.unit.toLowerCase() === fromUnit.toLowerCase())
  const toDef = units.find(u => u.unit.toLowerCase() === toUnit.toLowerCase())

  if (!fromDef || !toDef || toDef.multiplier === 0) return qty

  return (qty * fromDef.multiplier) / toDef.multiplier
}
