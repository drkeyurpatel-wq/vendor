// ============================================================
// H1 VPMS — Hospital-Grade TypeScript Types
// Matches 002_hospital_grade_overhaul.sql schema
//
// PII/PHI Tagging Convention (per Engineering v2 supplement):
//   @PII           — Personally identifiable (name, phone, email)
//   @PII-financial — Financial/compliance PII (GSTIN, PAN, bank details)
//   @PHI           — Protected health information (if applicable)
// These tags enable automated audit: grep -r "@PII" src/types/
// ============================================================

// ─── Enums ────────────────────────────────────────────────

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

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'sent_to_vendor' | 'partially_received' | 'fully_received' | 'cancelled' | 'closed'
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

export interface Centre {
  id: string
  tenant_id: string | null
  code: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  /** @PII */ phone: string | null
  /** @PII */ email: string | null
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  tenant_id: string | null
  /** @PII */ full_name: string
  /** @PII */ email: string
  /** @PII */ phone: string | null
  role: UserRole
  centre_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  centre?: Centre
}


// ─── Vendor ───────────────────────────────────────────────

export interface VendorCategory {
  id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
}

export interface Vendor {
  id: string
  tenant_id: string | null
  vendor_code: string
  legal_name: string
  trade_name: string | null
  category_id: string | null
  vendor_type: VendorType
  /** @PII-financial */ gstin: string | null
  /** @PII-financial */ pan: string | null
  /** @PII-financial */ drug_license_no: string | null
  /** @PII-financial */ fssai_no: string | null
  // MSME
  /** @PII-financial */ msme_registration_no: string | null
  /** @PII-financial */ udyam_number: string | null
  msme_category: MSMECategory | null
  // Compliance
  drug_license_expiry: string | null
  fssai_expiry: string | null
  gst_return_status: string | null
  // TDS
  tds_applicable: boolean
  tds_section: string | null
  tds_rate: number | null
  lower_tds_certificate: boolean
  lower_tds_rate: number | null
  lower_tds_valid_till: string | null
  // Contacts
  /** @PII */ primary_contact_name: string | null
  /** @PII */ primary_contact_phone: string | null
  /** @PII */ primary_contact_email: string | null
  /** @PII */ secondary_contact_name: string | null
  /** @PII */ secondary_contact_phone: string | null
  /** @PII */ secondary_contact_email: string | null
  secondary_contact_designation: string | null
  // Address
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  // Banking
  bank_name: string | null
  /** @PII-financial */ bank_account_no: string | null
  /** @PII-financial */ bank_ifsc: string | null
  bank_account_type: string | null
  bank_verified: boolean
  // Commercial
  credit_period_days: number
  credit_limit: number | null
  payment_mode_preferred: PaymentMode | null
  minimum_order_value: number | null
  trade_discount_percent: number
  cash_discount_percent: number
  cash_discount_days: number | null
  delivery_terms: string | null
  payment_terms: string | null
  // Tally
  tally_ledger_name: string | null
  tally_group: string | null
  // Status
  status: VendorStatus
  gstin_verified: boolean
  pan_verified: boolean
  approved_centres: string[] | null
  portal_access: boolean
  /** @PII */ portal_email: string | null
  // Meta
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Relations
  category?: VendorCategory
  contacts?: VendorContact[]
  delivery_zones?: VendorDeliveryZone[]
  compliance?: VendorCompliance[]
}

export interface VendorContact {
  id: string
  vendor_id: string
  contact_name: string
  designation: string | null
  /** @PII */ phone: string | null
  /** @PII */ email: string | null
  is_primary: boolean
  is_active: boolean
  created_at: string
}

export interface VendorDeliveryZone {
  id: string
  vendor_id: string
  centre_id: string
  delivery_lead_days: number
  min_order_value: number | null
  is_active: boolean
  centre?: Centre
}

export interface VendorCompliance {
  id: string
  vendor_id: string
  compliance_type: string
  document_number: string | null
  issued_date: string | null
  expiry_date: string | null
  status: string
  file_path: string | null
  notes: string | null
  created_at: string
}


// ─── Item ─────────────────────────────────────────────────

export interface ItemCategory {
  id: string
  name: string
  code: string
  parent_id: string | null
  is_active: boolean
}

export interface Item {
  id: string
  tenant_id: string | null
  item_code: string
  generic_name: string
  brand_name: string | null
  category_id: string | null
  // Coding & Classification
  snomed_ct_code: string | null
  snomed_ct_description: string | null
  department: ItemDepartment
  major_group: string | null
  minor_group: string | null
  item_type: ItemType | null
  ndc_code: string | null
  // Drug details
  manufacturer: string | null
  marketed_by: string | null
  dosage_form: string | null
  route_of_administration: string | null
  specification: string | null
  combination_of_drugs: string | null
  strength: string | null
  therapeutic_class: string | null
  // Unit hierarchy
  unit: string
  unit_levels: number
  level1_unit: string | null
  level1_qty_per_unit: number
  level2_unit: string | null
  level2_qty_per_unit: number | null
  level3_unit: string | null
  level3_qty_per_unit: number | null
  purchase_unit: string | null
  receipt_unit: string | null
  issue_unit: string | null
  qty_conversion: number
  // ABC/VED/FSN
  item_nature_abc: ABCClass | null
  item_nature_ved: VEDClass | null
  item_nature_fsn: FSNClass | null
  // Tax & Pricing
  hsn_code: string | null
  gst_percent: number
  gst_slab: GSTSlab | null
  cgst_percent: number | null
  sgst_percent: number | null
  igst_percent: number | null
  default_rate: number | null
  mrp: number | null
  muc_percent: number | null
  margin_percent: number | null
  ec_percent: number | null
  ps_disc_percent: number
  mp_disc_percent: number
  grn_disc_percent: number
  is_non_disc: boolean
  freight: number
  // Flags
  is_active: boolean
  is_generic: boolean
  is_cold_chain: boolean
  is_narcotic: boolean
  is_high_alert: boolean
  is_hazardous: boolean
  is_imported: boolean
  is_rate_contract: boolean
  is_pharma_approved: boolean
  is_cssd_item: boolean
  is_high_risk: boolean
  is_stockable: boolean
  is_consignment: boolean
  is_capital_goods: boolean
  is_refrigerated: boolean
  is_linen: boolean
  is_immunization: boolean
  is_dpco: boolean
  is_look_alike: boolean
  is_sound_alike: boolean
  is_gst_editable_in_grn: boolean
  is_emergency_drug: boolean
  is_kit: boolean
  is_spare_parts: boolean
  is_cpr_item: boolean
  is_cp_item: boolean
  allow_medicine_admin: boolean
  allow_combination: boolean
  scheduled_drug: boolean
  scheduled_drug_category: string | null
  free_period_hours: number | null
  // Storage & Reorder
  shelf_life_days: number | null
  storage_location: string | null
  bin_location: string | null
  reorder_point: number | null
  safety_stock: number | null
  min_order_qty: number | null
  max_order_qty: number | null
  lead_time_days: number | null
  // Integration
  ecw_item_code: string | null
  tally_item_name: string | null
  alias_names: string[] | null
  remarks: string | null
  notes: string | null
  // Meta
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Barcode (added by migration)
  barcode: string | null
  alternate_barcode: string | null
  category?: ItemCategory
}

export interface ItemCentreStock {
  id: string
  item_id: string
  centre_id: string
  current_stock: number
  reorder_level: number
  max_level: number
  safety_stock: number
  min_order_qty: number | null
  lead_time_days: number
  last_grn_date: string | null
  last_grn_rate: number | null
  avg_daily_consumption: number | null
  last_consumption_date: string | null
  last_physical_count_date: string | null
  abc_class: ABCClass | null
  ved_class: VEDClass | null
  updated_at: string
  item?: Item
  centre?: Centre
}


// ─── Purchase Orders ──────────────────────────────────────

export interface PurchaseOrder {
  id: string
  tenant_id: string | null
  po_number: string
  centre_id: string
  vendor_id: string
  indent_id: string | null
  status: POStatus
  priority: POPriority
  po_date: string
  expected_delivery_date: string | null
  // Amounts
  subtotal: number
  gst_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  // Discounts & charges
  trade_discount_percent: number
  cash_discount_percent: number
  special_discount_percent: number
  discount_amount: number
  freight_amount: number
  loading_charges: number
  insurance_charges: number
  other_charges: number
  round_off: number
  net_amount: number
  // TDS
  tds_applicable: boolean
  tds_section: string | null
  tds_rate: number | null
  tds_amount: number
  // Terms
  terms_and_conditions: string | null
  delivery_instructions: string | null
  payment_terms: string | null
  quotation_ref: string | null
  quotation_date: string | null
  // Amendment
  revision_number: number
  amended_from: string | null
  // Workflow
  notes: string | null
  current_approval_level: number
  approved_by: string | null
  approved_at: string | null
  sent_to_vendor_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Vendor portal fields (added by migration)
  cancellation_reason: string | null
  cancelled_at: string | null
  closed_at: string | null
  delivery_address: string | null
  supply_type: SupplyType
  vendor_acknowledged: boolean
  vendor_acknowledged_at: string | null
  vendor_confirmed_delivery_date: string | null
  vendor_dispute: boolean
  vendor_dispute_at: string | null
  vendor_dispute_reason: string | null
  vendor_notes: string | null
  // Relations
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
  pending_qty: number | null
  cancelled_qty: number
  free_qty: number
  unit: string
  purchase_unit: string | null
  conversion_factor: number
  base_qty: number | null
  // Pricing
  rate: number
  net_rate: number | null
  mrp: number | null
  // Discounts
  trade_discount_percent: number
  trade_discount_amount: number
  cash_discount_percent: number
  special_discount_percent: number
  // Tax (CGST/SGST/IGST)
  gst_percent: number
  gst_amount: number
  cgst_percent: number | null
  sgst_percent: number | null
  igst_percent: number | null
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  // Other
  hsn_code: string | null
  manufacturer: string | null
  delivery_date: string | null
  rate_contract_id: string | null
  contract_rate: number | null
  notes: string | null
  item?: Item
}

export interface POAmendment {
  id: string
  po_id: string
  revision_number: number
  amendment_reason: string
  changed_fields: Record<string, unknown>
  previous_values: Record<string, unknown>
  amended_by: string | null
  created_at: string
}


// ─── GRN ──────────────────────────────────────────────────

export interface GRN {
  id: string
  tenant_id: string | null
  grn_number: string
  centre_id: string
  po_id: string
  vendor_id: string
  grn_date: string
  // Vendor docs
  vendor_invoice_no: string | null
  vendor_invoice_date: string | null
  vendor_invoice_amount: number | null
  dc_number: string | null
  dc_date: string | null
  lr_number: string | null
  transport_name: string | null
  vehicle_number: string | null
  eway_bill_no: string | null
  // QC
  status: GRNStatus
  quality_status: QCStatus
  qc_checked_by: string | null
  qc_date: string | null
  qc_notes: string | null
  quarantine_till: string | null
  // Return
  is_return_generated: boolean
  return_debit_note_no: string | null
  // Amounts
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  discount_amount: number
  net_amount: number
  // Workflow
  notes: string | null
  received_by: string | null
  verified_by: string | null
  verified_at: string | null
  qc_completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Relations
  po?: PurchaseOrder
  vendor?: Vendor
  centre?: Centre
  items?: GRNItem[]
}

export interface GRNItem {
  id: string
  grn_id: string
  po_item_id: string
  item_id: string
  ordered_qty: number
  received_qty: number
  accepted_qty: number
  rejected_qty: number
  short_qty: number
  excess_qty: number
  damaged_qty: number
  free_qty: number
  rejection_reason: string | null
  damage_reason: string | null
  // Unit conversion
  receipt_unit: string | null
  conversion_factor: number
  base_received_qty: number | null
  // Batch
  batch_no: string | null
  expiry_date: string | null
  mrp: number | null
  manufacturer: string | null
  storage_location: string | null
  // Pricing
  rate: number
  net_rate: number | null
  trade_discount_percent: number
  trade_discount_amount: number
  // Tax
  gst_percent: number
  cgst_percent: number | null
  sgst_percent: number | null
  igst_percent: number | null
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  hsn_code: string | null
  // QC
  qc_status: QCItemStatus
  qc_remarks: string | null
  // Batch tracking (added by migration)
  batch_number: string | null
  manufacture_date: string | null
  item?: Item
}

export interface GRNReturn {
  id: string
  return_number: string
  grn_id: string
  vendor_id: string
  centre_id: string
  return_date: string
  reason: ReturnReason
  debit_note_no: string | null
  debit_note_date: string | null
  total_amount: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  net_amount: number
  status: string
  approved_by: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}


// ─── Finance ──────────────────────────────────────────────

export interface Invoice {
  id: string
  tenant_id: string | null
  invoice_ref: string
  vendor_invoice_no: string
  vendor_invoice_date: string
  centre_id: string
  vendor_id: string
  grn_id: string | null
  po_id: string | null
  // Amounts
  subtotal: number
  gst_amount: number
  cgst_amount_split: number
  sgst_amount_split: number
  igst_amount_split: number
  total_amount: number
  trade_discount: number
  cash_discount: number
  round_off: number
  net_payable: number | null
  // TDS
  tds_applicable: boolean
  tds_section: string | null
  tds_rate: number | null
  tds_amount: number
  // Adjustments
  advance_adjusted: number
  debit_note_adjusted: number
  credit_note_adjusted: number
  // 3-way match
  match_status: MatchStatus
  match_notes: string | null
  qty_match: boolean | null
  rate_match: boolean | null
  gst_match: boolean | null
  duplicate_check: boolean | null
  // Payment
  credit_period_days: number
  due_date: string
  payment_status: PaymentStatus
  paid_amount: number
  payment_batch_id: string | null
  // GST compliance
  supply_type: SupplyType
  place_of_supply: string | null
  eway_bill_no: string | null
  irn_number: string | null
  is_proforma: boolean
  // Tally
  tally_voucher_no: string | null
  tally_sync_date: string | null
  // Document
  invoice_file_path: string | null
  status: InvoiceStatus
  approved_by: string | null
  approved_at: string | null
  // Dispute & settlement (added by migration)
  dispute_reason: string | null
  disputed_at: string | null
  match_details: Record<string, unknown> | null
  paid_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Relations
  vendor?: Vendor
  centre?: Centre
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  po_item_id: string | null
  grn_item_id: string | null
  item_id: string
  description: string | null
  qty: number
  rate: number
  unit: string | null
  free_qty: number
  mrp: number | null
  hsn_code: string | null
  batch_no: string | null
  expiry_date: string | null
  // Discount
  trade_discount_percent: number
  trade_discount_amount: number
  // Tax
  gst_percent: number
  gst_amount: number
  cgst_percent: number | null
  sgst_percent: number | null
  igst_percent: number | null
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  // 3-way line match
  po_qty: number | null
  grn_qty: number | null
  po_rate: number | null
  grn_rate: number | null
  qty_match: boolean | null
  rate_match: boolean | null
  line_match_status: LineMatchStatus | null
  item?: Item
}

export interface DebitNote {
  id: string
  debit_note_number: string
  centre_id: string
  vendor_id: string
  invoice_id: string | null
  grn_return_id: string | null
  debit_note_date: string
  reason: DebitNoteReason
  subtotal: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  status: string
  adjusted_in_invoice_id: string | null
  adjusted_in_batch_id: string | null
  approved_by: string | null
  notes: string | null
  tally_voucher_no: string | null
  created_by: string | null
  created_at: string
  vendor?: Vendor
  centre?: Centre
}

export interface CreditNote {
  id: string
  credit_note_number: string
  centre_id: string
  vendor_id: string
  invoice_id: string | null
  credit_note_date: string
  reason: CreditNoteReason
  subtotal: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  status: string
  adjusted_in_invoice_id: string | null
  approved_by: string | null
  notes: string | null
  tally_voucher_no: string | null
  created_by: string | null
  created_at: string
  vendor?: Vendor
  centre?: Centre
}

export interface VendorAdvance {
  id: string
  advance_number: string
  centre_id: string
  vendor_id: string
  advance_date: string
  amount: number
  balance: number
  payment_mode: PaymentMode | null
  reference_number: string | null
  purpose: string | null
  status: string
  approved_by: string | null
  created_by: string | null
  created_at: string
  vendor?: Vendor
  centre?: Centre
}


// ─── Inventory ────────────────────────────────────────────

export interface BatchStock {
  id: string
  item_id: string
  centre_id: string
  batch_no: string
  expiry_date: string | null
  mrp: number | null
  purchase_rate: number | null
  qty_available: number
  qty_quarantine: number
  grn_id: string | null
  grn_date: string | null
  manufacturer: string | null
  storage_location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  item?: Item
  centre?: Centre
}

export interface StockTransfer {
  id: string
  transfer_number: string
  from_centre_id: string
  to_centre_id: string
  transfer_date: string
  status: TransferStatus
  total_items: number
  total_value: number
  requested_by: string | null
  approved_by: string | null
  dispatched_by: string | null
  received_by: string | null
  dispatched_at: string | null
  received_at: string | null
  notes: string | null
  created_at: string
  from_centre?: Centre
  to_centre?: Centre
  items?: StockTransferItem[]
}

export interface StockTransferItem {
  id: string
  transfer_id: string
  item_id: string
  batch_no: string | null
  expiry_date: string | null
  requested_qty: number
  dispatched_qty: number
  received_qty: number
  unit: string
  rate: number | null
  total_value: number | null
  short_qty: number
  damaged_qty: number
  notes: string | null
  item?: Item
}

export interface StockVerification {
  id: string
  verification_number: string
  centre_id: string
  verification_date: string
  verification_type: VerificationType
  status: string
  total_items: number
  matched_items: number
  discrepancy_items: number
  total_excess_value: number
  total_shortage_value: number
  conducted_by: string | null
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  centre?: Centre
  items?: StockVerificationItem[]
}

export interface StockVerificationItem {
  id: string
  verification_id: string
  item_id: string
  batch_no: string | null
  expiry_date: string | null
  system_qty: number
  physical_qty: number
  difference_qty: number
  unit: string
  rate: number | null
  difference_value: number | null
  status: 'matched' | 'excess' | 'shortage'
  reason: string | null
  adjustment_approved: boolean
  notes: string | null
  item?: Item
}

// ─── Views ────────────────────────────────────────────────

export interface ExpiryAlert {
  id: string
  item_id: string
  item_code: string
  generic_name: string
  brand_name: string | null
  centre_id: string
  centre_code: string
  centre_name: string
  batch_no: string
  expiry_date: string
  qty_available: number
  mrp: number | null
  purchase_rate: number | null
  alert_level: ExpiryAlertLevel
  days_to_expiry: number
}

export interface ReorderAlert {
  item_id: string
  item_code: string
  generic_name: string
  brand_name: string | null
  manufacturer: string | null
  centre_id: string
  centre_code: string
  centre_name: string
  current_stock: number
  reorder_level: number
  safety_stock: number
  max_level: number
  avg_daily_consumption: number | null
  last_grn_date: string | null
  last_grn_rate: number | null
  lead_time_days: number | null
  alert_level: StockAlertLevel
  days_of_stock: number | null
}

export interface VendorOutstanding {
  vendor_id: string
  vendor_code: string
  legal_name: string
  trade_name: string | null
  centre_id: string
  centre_code: string
  centre_name: string
  total_invoices: number
  total_billed: number
  total_paid: number
  total_outstanding: number
  overdue_amount: number
  due_0_30: number
  overdue_0_30: number
  overdue_31_60: number
  overdue_61_90: number
  overdue_90_plus: number
}


// ─── Rate Contracts ──────────────────────────────────────

export type RateContractStatus = 'draft' | 'active' | 'expired' | 'terminated'
export type RateContractType = 'annual' | 'quarterly' | 'spot'

export interface RateContract {
  id: string
  contract_number: string
  vendor_id: string
  centre_id: string | null
  contract_type: RateContractType
  status: RateContractStatus
  start_date: string
  end_date: string
  terms_and_conditions: string | null
  notes: string | null
  termination_reason: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  vendor?: Vendor
  centre?: Centre
  items?: RateContractItem[]
}

export interface RateContractItem {
  id: string
  rate_contract_id: string
  item_id: string
  contracted_rate: number
  max_qty: number | null
  min_qty: number | null
  l_rank: number
  tolerance_percent: number
  notes: string | null
  item?: Item
}

// ─── Vendor Performance ──────────────────────────────────

export interface VendorPerformance {
  id: string
  vendor_id: string
  centre_id: string | null
  period_month: string
  delivery_score: number
  quality_score: number
  price_score: number
  service_score: number
  overall_score: number
  total_pos: number
  on_time_deliveries: number
  rejected_items: number
  notes: string | null
  created_at: string
  vendor?: Vendor
  centre?: Centre
}

// ─── Activity Log ────────────────────────────────────────

export interface ActivityLog {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  user_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  user?: UserProfile
}

// ─── Existing types kept for backward compatibility ───────

export interface PurchaseIndent {
  id: string
  indent_number: string
  centre_id: string
  requested_by: string
  status: string
  priority: string
  notes: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  centre?: Centre
}


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
