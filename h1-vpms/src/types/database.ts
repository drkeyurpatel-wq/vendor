export type UserRole =
  | 'group_admin'
  | 'group_cao'
  | 'unit_cao'
  | 'unit_purchase_manager'
  | 'store_staff'
  | 'finance_staff'
  | 'vendor'

export type VendorStatus = 'pending' | 'active' | 'inactive' | 'blacklisted' | 'under_review'
export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent_to_vendor' | 'partially_received' | 'fully_received' | 'cancelled' | 'closed'
export type GRNStatus = 'draft' | 'submitted' | 'verified' | 'discrepancy'
export type InvoiceStatus = 'pending' | 'approved' | 'rejected' | 'disputed'
export type MatchStatus = 'pending' | 'matched' | 'partial_match' | 'mismatch'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'disputed' | 'on_hold'

export interface Centre {
  id: string
  code: string
  name: string
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  centre_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  centre?: Centre
}

export interface VendorCategory {
  id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
}

export interface Vendor {
  id: string
  vendor_code: string
  legal_name: string
  trade_name: string | null
  category_id: string | null
  gstin: string | null
  pan: string | null
  drug_license_no: string | null
  primary_contact_name: string | null
  primary_contact_phone: string | null
  primary_contact_email: string | null
  address: string | null
  city: string | null
  state: string | null
  credit_period_days: number
  credit_limit: number | null
  bank_name: string | null
  bank_account_no: string | null
  bank_ifsc: string | null
  bank_verified: boolean
  status: VendorStatus
  gstin_verified: boolean
  pan_verified: boolean
  approved_centres: string[] | null
  portal_access: boolean
  created_at: string
  updated_at: string
  category?: VendorCategory
}

export interface ItemCategory {
  id: string
  name: string
  code: string
  parent_id: string | null
  is_active: boolean
}

export interface Item {
  id: string
  item_code: string
  generic_name: string
  brand_name: string | null
  category_id: string | null
  unit: string
  hsn_code: string | null
  gst_percent: number
  shelf_life_days: number | null
  is_cold_chain: boolean
  is_narcotic: boolean
  is_high_alert: boolean
  is_active: boolean
  ecw_item_code: string | null
  created_at: string
  category?: ItemCategory
}

export interface ItemCentreStock {
  id: string
  item_id: string
  centre_id: string
  current_stock: number
  reorder_level: number
  max_level: number
  last_grn_date: string | null
  last_grn_rate: number | null
  avg_daily_consumption: number | null
  updated_at: string
  item?: Item
  centre?: Centre
}

export interface PurchaseOrder {
  id: string
  po_number: string
  centre_id: string
  vendor_id: string
  status: POStatus
  po_date: string
  expected_delivery_date: string | null
  subtotal: number
  gst_amount: number
  total_amount: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  vendor?: Vendor
  centre?: Centre
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  po_id: string
  item_id: string
  ordered_qty: number
  received_qty: number
  unit: string
  rate: number
  gst_percent: number
  gst_amount: number
  total_amount: number
  item?: Item
}

export interface GRN {
  id: string
  grn_number: string
  centre_id: string
  po_id: string
  vendor_id: string
  grn_date: string
  vendor_invoice_no: string | null
  vendor_invoice_date: string | null
  vendor_invoice_amount: number | null
  status: GRNStatus
  notes: string | null
  received_by: string | null
  created_at: string
  po?: PurchaseOrder
  vendor?: Vendor
  centre?: Centre
}

export interface Invoice {
  id: string
  invoice_ref: string
  vendor_invoice_no: string
  vendor_invoice_date: string
  centre_id: string
  vendor_id: string
  grn_id: string | null
  po_id: string | null
  total_amount: number
  gst_amount: number
  match_status: MatchStatus
  credit_period_days: number
  due_date: string
  payment_status: PaymentStatus
  paid_amount: number
  status: InvoiceStatus
  created_at: string
  vendor?: Vendor
  centre?: Centre
}

// Role permission helpers
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
  auto: 10000,       // unit_purchase_manager auto-approves
  unit_pm: 50000,    // unit purchase manager
  unit_cao: 200000,  // unit CAO
  group_cao: 1000000, // group CAO
  group_admin: Infinity, // Keyur
}
