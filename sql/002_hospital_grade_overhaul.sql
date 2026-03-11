-- ============================================================
-- H1 VPMS — HOSPITAL-GRADE SCHEMA OVERHAUL
-- Migration 002: Upgrade all tables to 500-bed super specialty level
-- Run AFTER 001_schema.sql in Supabase SQL Editor
-- Rule: Only ADD COLUMN or CREATE TABLE — never ALTER/DROP existing
-- ============================================================

-- ============================================================
-- 1. ITEM MASTER — Match eClinicalWorks depth
-- ============================================================

-- Coding & Classification
ALTER TABLE items ADD COLUMN IF NOT EXISTS snomed_ct_code text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS snomed_ct_description text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS department text DEFAULT 'Medical'
  CHECK (department IN ('Medical','Surgical','Dental','Lab','Radiology','Dietary','Housekeeping','Engineering','IT','General'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS major_group text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS minor_group text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_type text
  CHECK (item_type IN ('drug','consumable','surgical','implant','equipment','reagent','linen','stationery','food','other'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS ndc_code text;

-- Drug Details
ALTER TABLE items ADD COLUMN IF NOT EXISTS manufacturer text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS marketed_by text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS dosage_form text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS route_of_administration text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS specification text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS combination_of_drugs text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS strength text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS therapeutic_class text;

-- Unit Hierarchy (Purchase > Receipt > Issue with conversion)
ALTER TABLE items ADD COLUMN IF NOT EXISTS unit_levels integer DEFAULT 1 CHECK (unit_levels IN (1,2,3));
ALTER TABLE items ADD COLUMN IF NOT EXISTS level1_unit text;           -- e.g., Box
ALTER TABLE items ADD COLUMN IF NOT EXISTS level1_qty_per_unit numeric(15,3) DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS level2_unit text;           -- e.g., Strip
ALTER TABLE items ADD COLUMN IF NOT EXISTS level2_qty_per_unit numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS level3_unit text;           -- e.g., Tablet
ALTER TABLE items ADD COLUMN IF NOT EXISTS level3_qty_per_unit numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS purchase_unit text;         -- unit used in PO
ALTER TABLE items ADD COLUMN IF NOT EXISTS receipt_unit text;          -- unit used in GRN
ALTER TABLE items ADD COLUMN IF NOT EXISTS issue_unit text;            -- unit used for dispensing
ALTER TABLE items ADD COLUMN IF NOT EXISTS qty_conversion numeric(15,3) DEFAULT 1; -- purchase to issue conversion factor

-- Item Nature / ABC-VED-FSN Analysis
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_nature_abc text CHECK (item_nature_abc IN ('A','B','C'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_nature_ved text CHECK (item_nature_ved IN ('V','E','D'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_nature_fsn text CHECK (item_nature_fsn IN ('F','S','N'));

-- Hospital Flags (matching ECW)
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_generic boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_hazardous boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_imported boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_rate_contract boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_pharma_approved boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_cssd_item boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_high_risk boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_stockable boolean DEFAULT true;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_consignment boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_capital_goods boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_refrigerated boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_linen boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_immunization boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_dpco boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_look_alike boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_sound_alike boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_gst_editable_in_grn boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_emergency_drug boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_kit boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_spare_parts boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_cpr_item boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_cp_item boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS allow_medicine_admin boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS allow_combination boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS scheduled_drug boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS scheduled_drug_category text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS free_period_hours numeric(5,1);

-- Pricing & Tax (CGST/SGST/IGST split)
ALTER TABLE items ADD COLUMN IF NOT EXISTS default_rate numeric(15,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS muc_percent numeric(5,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS margin_percent numeric(5,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS ec_percent numeric(5,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS cgst_percent numeric(5,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS sgst_percent numeric(5,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS igst_percent numeric(5,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS gst_slab text CHECK (gst_slab IN ('0','5','12','18','28'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS ps_disc_percent numeric(5,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS mp_disc_percent numeric(5,2) DEFAULT 100;
ALTER TABLE items ADD COLUMN IF NOT EXISTS grn_disc_percent numeric(5,2) DEFAULT 0;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_non_disc boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS freight numeric(15,2) DEFAULT 0;

-- Storage & Tracking
ALTER TABLE items ADD COLUMN IF NOT EXISTS storage_location text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS bin_location text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS reorder_point numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS safety_stock numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS min_order_qty numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS max_order_qty numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS lead_time_days integer;

-- Alias names for search
ALTER TABLE items ADD COLUMN IF NOT EXISTS alias_names text[];
ALTER TABLE items ADD COLUMN IF NOT EXISTS remarks text;

-- Indexes for new fields
CREATE INDEX IF NOT EXISTS idx_items_manufacturer ON items(manufacturer) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_department ON items(department) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_snomed ON items(snomed_ct_code) WHERE snomed_ct_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_item_type ON items(item_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_major_group ON items(major_group) WHERE deleted_at IS NULL;


-- ============================================================
-- 2. VENDOR MASTER — Full compliance + multi-contact
-- ============================================================

-- Registration & Compliance
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type text DEFAULT 'distributor'
  CHECK (vendor_type IN ('manufacturer','distributor','dealer','importer','service_provider','c_and_f'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS msme_registration_no text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS udyam_number text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS msme_category text CHECK (msme_category IN ('micro','small','medium'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fssai_no text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS drug_license_expiry date;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fssai_expiry date;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gst_return_status text CHECK (gst_return_status IN ('regular','irregular','not_filed','not_applicable'));

-- TDS
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tds_applicable boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tds_section text;          -- e.g., 194C, 194J, 194Q
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tds_rate numeric(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lower_tds_certificate boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lower_tds_rate numeric(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lower_tds_valid_till date;

-- Extended commercial terms
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_mode_preferred text CHECK (payment_mode_preferred IN ('neft','rtgs','imps','cheque','upi','dd'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS minimum_order_value numeric(15,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cash_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cash_discount_days integer;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS delivery_terms text;

-- Tally integration
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tally_ledger_name text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tally_group text;

-- Secondary contact
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS secondary_contact_name text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS secondary_contact_phone text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS secondary_contact_email text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS secondary_contact_designation text;

-- Vendor contacts table for unlimited contacts
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  designation text,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Vendor delivery zones
CREATE TABLE IF NOT EXISTS vendor_delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  centre_id uuid NOT NULL REFERENCES centres(id),
  delivery_lead_days integer DEFAULT 3,
  min_order_value numeric(15,2),
  is_active boolean DEFAULT true,
  UNIQUE(vendor_id, centre_id)
);

-- Vendor compliance tracking (license expiry alerts)
CREATE TABLE IF NOT EXISTS vendor_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  compliance_type text NOT NULL CHECK (compliance_type IN (
    'drug_license','fssai','gst_registration','msme','trade_license',
    'iso_certificate','gmp_certificate','who_gmp','insurance','other'
  )),
  document_number text,
  issued_date date,
  expiry_date date,
  status text DEFAULT 'valid' CHECK (status IN ('valid','expiring_soon','expired','not_applicable')),
  file_path text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_compliance_expiry ON vendor_compliance(expiry_date) WHERE status != 'not_applicable';
CREATE INDEX IF NOT EXISTS idx_vendor_contacts ON vendor_contacts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_delivery_zones ON vendor_delivery_zones(vendor_id);


-- ============================================================
-- 3. PURCHASE ORDERS — Discount tiers + freight + amendments
-- ============================================================

-- PO header additions
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS revision_number integer DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS amended_from uuid REFERENCES purchase_orders(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cash_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS special_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS freight_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS loading_charges numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS insurance_charges numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS other_charges numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS round_off numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS net_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_applicable boolean DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_section text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_rate numeric(5,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_and_conditions text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_instructions text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quotation_ref text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quotation_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','urgent','emergency'));

-- PO line item additions
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS purchase_unit text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS conversion_factor numeric(15,3) DEFAULT 1;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS base_qty numeric(15,3);      -- qty in base/issue unit
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS trade_discount_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cash_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS special_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS net_rate numeric(15,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cgst_percent numeric(5,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS sgst_percent numeric(5,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS igst_percent numeric(5,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS free_qty numeric(15,3) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS pending_qty numeric(15,3);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cancelled_qty numeric(15,3) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS manufacturer text;

-- PO amendment history
CREATE TABLE IF NOT EXISTS po_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  amendment_reason text NOT NULL,
  changed_fields jsonb NOT NULL,
  previous_values jsonb NOT NULL,
  amended_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- PO terms templates
CREATE TABLE IF NOT EXISTS po_terms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  terms_text text NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);


-- ============================================================
-- 4. GRN — QC workflow + batch tracking + return flow
-- ============================================================

-- GRN header additions
ALTER TABLE grns ADD COLUMN IF NOT EXISTS dc_number text;              -- delivery challan number
ALTER TABLE grns ADD COLUMN IF NOT EXISTS dc_date date;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS lr_number text;              -- lorry receipt
ALTER TABLE grns ADD COLUMN IF NOT EXISTS transport_name text;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS vehicle_number text;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS eway_bill_no text;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS quality_status text DEFAULT 'pending'
  CHECK (quality_status IN ('pending','under_qc','approved','rejected','partial_approved'));
ALTER TABLE grns ADD COLUMN IF NOT EXISTS qc_checked_by uuid REFERENCES user_profiles(id);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS qc_date timestamptz;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS qc_notes text;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS quarantine_till date;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS is_return_generated boolean DEFAULT false;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS return_debit_note_no text;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS total_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS discount_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS net_amount numeric(15,2) DEFAULT 0;

-- GRN line item additions
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS receipt_unit text;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS conversion_factor numeric(15,3) DEFAULT 1;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS base_received_qty numeric(15,3);  -- in issue unit
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS free_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS short_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS excess_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS damaged_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS damage_reason text;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS trade_discount_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS net_rate numeric(15,2);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS cgst_percent numeric(5,2);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS sgst_percent numeric(5,2);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS igst_percent numeric(5,2);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS qc_status text DEFAULT 'pending'
  CHECK (qc_status IN ('pending','approved','rejected','under_review'));
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS qc_remarks text;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS storage_location text;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS manufacturer text;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS hsn_code text;

-- Return to Vendor (Debit Notes from GRN)
CREATE TABLE IF NOT EXISTS grn_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text NOT NULL UNIQUE,
  grn_id uuid NOT NULL REFERENCES grns(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  centre_id uuid NOT NULL REFERENCES centres(id),
  return_date date DEFAULT current_date,
  reason text NOT NULL CHECK (reason IN ('damaged','expired','wrong_item','quality_fail','excess','short_expiry','other')),
  debit_note_no text,
  debit_note_date date,
  total_amount numeric(15,2) DEFAULT 0,
  cgst_amount numeric(15,2) DEFAULT 0,
  sgst_amount numeric(15,2) DEFAULT 0,
  igst_amount numeric(15,2) DEFAULT 0,
  net_amount numeric(15,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','dispatched','credit_received','cancelled')),
  approved_by uuid REFERENCES user_profiles(id),
  notes text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grn_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES grn_returns(id) ON DELETE CASCADE,
  grn_item_id uuid NOT NULL REFERENCES grn_items(id),
  item_id uuid NOT NULL REFERENCES items(id),
  return_qty numeric(15,3) NOT NULL,
  unit text NOT NULL,
  rate numeric(15,2) NOT NULL,
  batch_no text,
  expiry_date date,
  reason text,
  total_amount numeric(15,2) NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS return_number_seq START 1;


-- ============================================================
-- 5. FINANCE — CGST/SGST split + TDS + Debit/Credit Notes
-- ============================================================

-- Invoice header additions
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cgst_amount_split numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sgst_amount_split numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS igst_amount_split numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tds_applicable boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tds_section text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tds_rate numeric(5,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tds_amount numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS trade_discount numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cash_discount numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS round_off numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_payable numeric(15,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS advance_adjusted numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS debit_note_adjusted numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS credit_note_adjusted numeric(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_proforma boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS eway_bill_no text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS irn_number text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supply_type text DEFAULT 'intra_state'
  CHECK (supply_type IN ('intra_state','inter_state'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tally_voucher_no text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tally_sync_date timestamptz;

-- Invoice line items additions
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS batch_no text;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS trade_discount_amount numeric(15,2) DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cgst_percent numeric(5,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sgst_percent numeric(5,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS igst_percent numeric(5,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS free_qty numeric(15,3) DEFAULT 0;
-- Line-level 3-way match
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS po_qty numeric(15,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS grn_qty numeric(15,3);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS po_rate numeric(15,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS grn_rate numeric(15,2);
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS qty_match boolean;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS rate_match boolean;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS line_match_status text
  CHECK (line_match_status IN ('matched','qty_mismatch','rate_mismatch','both_mismatch','pending'));

-- Debit Notes
CREATE TABLE IF NOT EXISTS debit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number text NOT NULL UNIQUE,
  centre_id uuid NOT NULL REFERENCES centres(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  invoice_id uuid REFERENCES invoices(id),
  grn_return_id uuid REFERENCES grn_returns(id),
  debit_note_date date NOT NULL DEFAULT current_date,
  reason text NOT NULL CHECK (reason IN ('goods_return','rate_difference','quality_issue','shortage','damaged','other')),
  subtotal numeric(15,2) NOT NULL,
  cgst_amount numeric(15,2) DEFAULT 0,
  sgst_amount numeric(15,2) DEFAULT 0,
  igst_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','sent','adjusted','cancelled')),
  adjusted_in_invoice_id uuid REFERENCES invoices(id),
  adjusted_in_batch_id uuid REFERENCES payment_batches(id),
  approved_by uuid REFERENCES user_profiles(id),
  notes text,
  tally_voucher_no text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_id uuid NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  qty numeric(15,3) NOT NULL,
  rate numeric(15,2) NOT NULL,
  unit text NOT NULL,
  hsn_code text,
  gst_percent numeric(5,2),
  cgst_amount numeric(15,2) DEFAULT 0,
  sgst_amount numeric(15,2) DEFAULT 0,
  igst_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) NOT NULL,
  batch_no text,
  reason text
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number text NOT NULL UNIQUE,
  centre_id uuid NOT NULL REFERENCES centres(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  invoice_id uuid REFERENCES invoices(id),
  credit_note_date date NOT NULL DEFAULT current_date,
  reason text NOT NULL CHECK (reason IN ('rate_revision','additional_discount','scheme_credit','advance_payment','other')),
  subtotal numeric(15,2) NOT NULL,
  cgst_amount numeric(15,2) DEFAULT 0,
  sgst_amount numeric(15,2) DEFAULT 0,
  igst_amount numeric(15,2) DEFAULT 0,
  total_amount numeric(15,2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','adjusted','cancelled')),
  adjusted_in_invoice_id uuid REFERENCES invoices(id),
  approved_by uuid REFERENCES user_profiles(id),
  notes text,
  tally_voucher_no text,
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Vendor advance payments
CREATE TABLE IF NOT EXISTS vendor_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_number text NOT NULL UNIQUE,
  centre_id uuid NOT NULL REFERENCES centres(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  advance_date date NOT NULL DEFAULT current_date,
  amount numeric(15,2) NOT NULL,
  balance numeric(15,2) NOT NULL,
  payment_mode text CHECK (payment_mode IN ('neft','rtgs','imps','cheque','upi','dd','cash')),
  reference_number text,
  purpose text,
  status text DEFAULT 'active' CHECK (status IN ('active','partially_adjusted','fully_adjusted','refunded')),
  approved_by uuid REFERENCES user_profiles(id),
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Advance adjustments against invoices
CREATE TABLE IF NOT EXISTS advance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_id uuid NOT NULL REFERENCES vendor_advances(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  amount numeric(15,2) NOT NULL,
  adjusted_date date DEFAULT current_date,
  adjusted_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Payment batch additions
ALTER TABLE payment_batches ADD COLUMN IF NOT EXISTS payment_mode text
  CHECK (payment_mode IN ('neft','rtgs','imps','cheque','upi','dd','mixed'));
ALTER TABLE payment_batches ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE payment_batches ADD COLUMN IF NOT EXISTS total_tds numeric(15,2) DEFAULT 0;
ALTER TABLE payment_batches ADD COLUMN IF NOT EXISTS total_deductions numeric(15,2) DEFAULT 0;
ALTER TABLE payment_batches ADD COLUMN IF NOT EXISTS net_payment numeric(15,2) DEFAULT 0;

-- Payment batch item additions
ALTER TABLE payment_batch_items ADD COLUMN IF NOT EXISTS invoice_amount numeric(15,2);
ALTER TABLE payment_batch_items ADD COLUMN IF NOT EXISTS tds_amount numeric(15,2) DEFAULT 0;
ALTER TABLE payment_batch_items ADD COLUMN IF NOT EXISTS debit_note_adjustment numeric(15,2) DEFAULT 0;
ALTER TABLE payment_batch_items ADD COLUMN IF NOT EXISTS advance_adjustment numeric(15,2) DEFAULT 0;
ALTER TABLE payment_batch_items ADD COLUMN IF NOT EXISTS net_payable numeric(15,2);
ALTER TABLE payment_batch_items ADD COLUMN IF NOT EXISTS bank_reference text;

CREATE SEQUENCE IF NOT EXISTS debit_note_seq START 1;
CREATE SEQUENCE IF NOT EXISTS credit_note_seq START 1;
CREATE SEQUENCE IF NOT EXISTS advance_seq START 1;


-- ============================================================
-- 6. INVENTORY — Batch-wise FIFO + transfers + expiry + cycle count
-- ============================================================

-- Batch-wise stock (FIFO tracking)
CREATE TABLE IF NOT EXISTS batch_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id),
  centre_id uuid NOT NULL REFERENCES centres(id),
  batch_no text NOT NULL,
  expiry_date date,
  mrp numeric(15,2),
  purchase_rate numeric(15,2),
  qty_available numeric(15,3) NOT NULL DEFAULT 0,
  qty_quarantine numeric(15,3) DEFAULT 0,
  grn_id uuid REFERENCES grns(id),
  grn_date date,
  manufacturer text,
  storage_location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batch_stock_item_centre ON batch_stock(item_id, centre_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_batch_stock_expiry ON batch_stock(expiry_date) WHERE qty_available > 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_batch_stock_unique ON batch_stock(item_id, centre_id, batch_no, COALESCE(grn_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Inter-unit transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number text NOT NULL UNIQUE,
  from_centre_id uuid NOT NULL REFERENCES centres(id),
  to_centre_id uuid NOT NULL REFERENCES centres(id),
  transfer_date date DEFAULT current_date,
  status text DEFAULT 'draft' CHECK (status IN ('draft','approved','in_transit','received','partial_received','cancelled')),
  total_items integer DEFAULT 0,
  total_value numeric(15,2) DEFAULT 0,
  requested_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  dispatched_by uuid REFERENCES user_profiles(id),
  received_by uuid REFERENCES user_profiles(id),
  dispatched_at timestamptz,
  received_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  batch_no text,
  expiry_date date,
  requested_qty numeric(15,3) NOT NULL,
  dispatched_qty numeric(15,3) DEFAULT 0,
  received_qty numeric(15,3) DEFAULT 0,
  unit text NOT NULL,
  rate numeric(15,2),
  total_value numeric(15,2),
  short_qty numeric(15,3) DEFAULT 0,
  damaged_qty numeric(15,3) DEFAULT 0,
  notes text
);

CREATE SEQUENCE IF NOT EXISTS transfer_number_seq START 1;

-- Physical stock verification / Cycle count
CREATE TABLE IF NOT EXISTS stock_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_number text NOT NULL UNIQUE,
  centre_id uuid NOT NULL REFERENCES centres(id),
  verification_date date DEFAULT current_date,
  verification_type text NOT NULL CHECK (verification_type IN ('full','cycle_count','random','expiry_check')),
  status text DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','approved')),
  total_items integer DEFAULT 0,
  matched_items integer DEFAULT 0,
  discrepancy_items integer DEFAULT 0,
  total_excess_value numeric(15,2) DEFAULT 0,
  total_shortage_value numeric(15,2) DEFAULT 0,
  conducted_by uuid REFERENCES user_profiles(id),
  approved_by uuid REFERENCES user_profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_verification_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES stock_verifications(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  batch_no text,
  expiry_date date,
  system_qty numeric(15,3) NOT NULL,
  physical_qty numeric(15,3) NOT NULL,
  difference_qty numeric(15,3) NOT NULL,
  unit text NOT NULL,
  rate numeric(15,2),
  difference_value numeric(15,2),
  status text CHECK (status IN ('matched','excess','shortage')),
  reason text,
  adjustment_approved boolean DEFAULT false,
  notes text
);

CREATE SEQUENCE IF NOT EXISTS verification_number_seq START 1;

-- Stock ledger additions for batch tracking
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS batch_no text;
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS rate numeric(15,2);
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS transfer_id uuid REFERENCES stock_transfers(id);
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS verification_id uuid REFERENCES stock_verifications(id);

-- Item centre stock additions
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS safety_stock numeric(15,3) DEFAULT 0;
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS min_order_qty numeric(15,3);
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS lead_time_days integer DEFAULT 3;
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS last_consumption_date date;
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS last_physical_count_date date;
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS abc_class text CHECK (abc_class IN ('A','B','C'));
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS ved_class text CHECK (ved_class IN ('V','E','D'));


-- ============================================================
-- 7. EXPIRY ALERT VIEW
-- ============================================================
CREATE OR REPLACE VIEW v_expiry_alerts AS
SELECT
  bs.id,
  bs.item_id,
  i.item_code,
  i.generic_name,
  i.brand_name,
  bs.centre_id,
  c.code AS centre_code,
  c.name AS centre_name,
  bs.batch_no,
  bs.expiry_date,
  bs.qty_available,
  bs.mrp,
  bs.purchase_rate,
  CASE
    WHEN bs.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN bs.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_30_days'
    WHEN bs.expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_90_days'
    WHEN bs.expiry_date < CURRENT_DATE + INTERVAL '180 days' THEN 'expiring_180_days'
    ELSE 'ok'
  END AS alert_level,
  bs.expiry_date - CURRENT_DATE AS days_to_expiry
FROM batch_stock bs
JOIN items i ON i.id = bs.item_id
JOIN centres c ON c.id = bs.centre_id
WHERE bs.qty_available > 0
  AND bs.is_active = true
  AND bs.expiry_date IS NOT NULL
  AND bs.expiry_date < CURRENT_DATE + INTERVAL '180 days'
ORDER BY bs.expiry_date ASC;


-- ============================================================
-- 8. VENDOR OUTSTANDING VIEW (for aging dashboard)
-- ============================================================
CREATE OR REPLACE VIEW v_vendor_outstanding AS
SELECT
  inv.vendor_id,
  v.vendor_code,
  v.legal_name,
  v.trade_name,
  inv.centre_id,
  c.code AS centre_code,
  c.name AS centre_name,
  COUNT(inv.id) AS total_invoices,
  SUM(inv.total_amount) AS total_billed,
  SUM(inv.paid_amount) AS total_paid,
  SUM(inv.total_amount - inv.paid_amount) AS total_outstanding,
  SUM(CASE WHEN inv.due_date < CURRENT_DATE THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS overdue_amount,
  SUM(CASE WHEN inv.due_date >= CURRENT_DATE AND inv.due_date < CURRENT_DATE + 30 THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS due_0_30,
  SUM(CASE WHEN inv.due_date < CURRENT_DATE AND inv.due_date >= CURRENT_DATE - 30 THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS overdue_0_30,
  SUM(CASE WHEN inv.due_date < CURRENT_DATE - 30 AND inv.due_date >= CURRENT_DATE - 60 THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS overdue_31_60,
  SUM(CASE WHEN inv.due_date < CURRENT_DATE - 60 AND inv.due_date >= CURRENT_DATE - 90 THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS overdue_61_90,
  SUM(CASE WHEN inv.due_date < CURRENT_DATE - 90 THEN inv.total_amount - inv.paid_amount ELSE 0 END) AS overdue_90_plus
FROM invoices inv
JOIN vendors v ON v.id = inv.vendor_id
JOIN centres c ON c.id = inv.centre_id
WHERE inv.payment_status != 'paid'
  AND inv.status != 'rejected'
GROUP BY inv.vendor_id, v.vendor_code, v.legal_name, v.trade_name, inv.centre_id, c.code, c.name
HAVING SUM(inv.total_amount - inv.paid_amount) > 0
ORDER BY SUM(inv.total_amount - inv.paid_amount) DESC;


-- ============================================================
-- 9. REORDER ALERT VIEW
-- ============================================================
CREATE OR REPLACE VIEW v_reorder_alerts AS
SELECT
  ics.item_id,
  i.item_code,
  i.generic_name,
  i.brand_name,
  i.manufacturer,
  ics.centre_id,
  c.code AS centre_code,
  c.name AS centre_name,
  ics.current_stock,
  ics.reorder_level,
  ics.safety_stock,
  ics.max_level,
  ics.avg_daily_consumption,
  ics.last_grn_date,
  ics.last_grn_rate,
  ics.lead_time_days,
  CASE
    WHEN ics.current_stock <= 0 THEN 'out_of_stock'
    WHEN ics.current_stock <= COALESCE(ics.safety_stock, 0) THEN 'critical'
    WHEN ics.current_stock <= ics.reorder_level THEN 'reorder'
    ELSE 'ok'
  END AS alert_level,
  CASE
    WHEN ics.avg_daily_consumption > 0
    THEN ROUND(ics.current_stock / ics.avg_daily_consumption)
    ELSE NULL
  END AS days_of_stock
FROM item_centre_stock ics
JOIN items i ON i.id = ics.item_id AND i.deleted_at IS NULL AND i.is_active = true
JOIN centres c ON c.id = ics.centre_id AND c.is_active = true
WHERE ics.current_stock <= ics.reorder_level
ORDER BY
  CASE
    WHEN ics.current_stock <= 0 THEN 1
    WHEN ics.current_stock <= COALESCE(ics.safety_stock, 0) THEN 2
    ELSE 3
  END,
  ics.current_stock ASC;


-- ============================================================
-- 10. RLS for new tables
-- ============================================================

ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_terms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_verification_items ENABLE ROW LEVEL SECURITY;

-- Vendor contacts: follow vendor access
CREATE POLICY "vendor_contacts_read" ON vendor_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_contacts.vendor_id));
CREATE POLICY "vendor_contacts_insert" ON vendor_contacts FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager'));
CREATE POLICY "vendor_contacts_update" ON vendor_contacts FOR UPDATE
  USING (get_my_role() IN ('group_admin','group_cao','unit_cao'));

-- Vendor delivery zones
CREATE POLICY "vendor_zones_read" ON vendor_delivery_zones FOR SELECT USING (true);
CREATE POLICY "vendor_zones_manage" ON vendor_delivery_zones FOR ALL
  USING (get_my_role() IN ('group_admin','group_cao','unit_cao'));

-- Vendor compliance
CREATE POLICY "vendor_compliance_read" ON vendor_compliance FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','finance_staff'));
CREATE POLICY "vendor_compliance_manage" ON vendor_compliance FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager'));

-- PO amendments
CREATE POLICY "po_amendments_read" ON po_amendments FOR SELECT
  USING (EXISTS (SELECT 1 FROM purchase_orders WHERE purchase_orders.id = po_amendments.po_id));
CREATE POLICY "po_amendments_insert" ON po_amendments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- PO terms templates
CREATE POLICY "po_terms_read" ON po_terms_templates FOR SELECT USING (true);
CREATE POLICY "po_terms_manage" ON po_terms_templates FOR ALL
  USING (get_my_role() IN ('group_admin','group_cao'));

-- GRN returns
CREATE POLICY "grn_returns_read" ON grn_returns FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id());
CREATE POLICY "grn_returns_insert" ON grn_returns FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff'));
CREATE POLICY "grn_return_items_read" ON grn_return_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM grn_returns WHERE grn_returns.id = grn_return_items.return_id));
CREATE POLICY "grn_return_items_insert" ON grn_return_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Debit notes
CREATE POLICY "debit_notes_read" ON debit_notes FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id());
CREATE POLICY "debit_notes_manage" ON debit_notes FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','finance_staff'));
CREATE POLICY "debit_note_items_read" ON debit_note_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM debit_notes WHERE debit_notes.id = debit_note_items.debit_note_id));
CREATE POLICY "debit_note_items_insert" ON debit_note_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Credit notes
CREATE POLICY "credit_notes_read" ON credit_notes FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id());
CREATE POLICY "credit_notes_manage" ON credit_notes FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','finance_staff'));

-- Vendor advances
CREATE POLICY "advances_read" ON vendor_advances FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id());
CREATE POLICY "advances_manage" ON vendor_advances FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','finance_staff'));

-- Advance adjustments
CREATE POLICY "adjustments_read" ON advance_adjustments FOR SELECT
  USING (EXISTS (SELECT 1 FROM vendor_advances WHERE vendor_advances.id = advance_adjustments.advance_id));
CREATE POLICY "adjustments_manage" ON advance_adjustments FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','finance_staff'));

-- Batch stock
CREATE POLICY "batch_stock_read" ON batch_stock FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id());
CREATE POLICY "batch_stock_manage" ON batch_stock FOR ALL
  USING (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff'));

-- Stock transfers
CREATE POLICY "transfers_read" ON stock_transfers FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR from_centre_id = get_my_centre_id() OR to_centre_id = get_my_centre_id());
CREATE POLICY "transfers_manage" ON stock_transfers FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff'));
CREATE POLICY "transfer_items_read" ON stock_transfer_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM stock_transfers WHERE stock_transfers.id = stock_transfer_items.transfer_id));
CREATE POLICY "transfer_items_insert" ON stock_transfer_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Stock verifications
CREATE POLICY "verifications_read" ON stock_verifications FOR SELECT
  USING (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id());
CREATE POLICY "verifications_manage" ON stock_verifications FOR INSERT
  WITH CHECK (get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff'));
CREATE POLICY "verification_items_read" ON stock_verification_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM stock_verifications WHERE stock_verifications.id = stock_verification_items.verification_id));
CREATE POLICY "verification_items_insert" ON stock_verification_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- 11. UPDATE sequence function for new types
-- ============================================================
CREATE OR REPLACE FUNCTION next_sequence_number(
  seq_name text,
  seq_type text,
  centre_code text DEFAULT 'XXX'
)
RETURNS text AS $$
DECLARE
  seq_val bigint;
  ym text;
BEGIN
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO seq_val;
  ym := to_char(now(), 'YYMM');

  CASE seq_type
    WHEN 'vendor' THEN RETURN 'H1V-' || lpad(seq_val::text, 4, '0');
    WHEN 'item' THEN RETURN 'H1I-' || lpad(seq_val::text, 5, '0');
    WHEN 'po' THEN RETURN 'H1-' || centre_code || '-PO-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'grn' THEN RETURN 'H1-' || centre_code || '-GRN-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'indent' THEN RETURN 'H1-' || centre_code || '-IND-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'invoice' THEN RETURN 'H1-' || centre_code || '-INV-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'batch' THEN RETURN 'H1-PAY-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'return' THEN RETURN 'H1-' || centre_code || '-RET-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'debit_note' THEN RETURN 'H1-' || centre_code || '-DN-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'credit_note' THEN RETURN 'H1-' || centre_code || '-CN-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'advance' THEN RETURN 'H1-' || centre_code || '-ADV-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'transfer' THEN RETURN 'H1-' || centre_code || '-TRF-' || ym || '-' || lpad(seq_val::text, 3, '0');
    WHEN 'verification' THEN RETURN 'H1-' || centre_code || '-PHV-' || ym || '-' || lpad(seq_val::text, 3, '0');
    ELSE RETURN seq_val::text;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 12. FUNCTION: Update batch stock from GRN (replaces simple stock update)
-- ============================================================
CREATE OR REPLACE FUNCTION update_stock_from_grn_v2(p_grn_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  r record;
  v_centre_id uuid;
  v_grn_number text;
  v_grn_date date;
  v_current numeric;
BEGIN
  SELECT centre_id, grn_number, grn_date INTO v_centre_id, v_grn_number, v_grn_date
    FROM grns WHERE id = p_grn_id;

  FOR r IN
    SELECT gi.item_id, gi.accepted_qty, gi.rate, gi.batch_no, gi.expiry_date,
           gi.mrp, gi.manufacturer, gi.storage_location, gi.receipt_unit,
           gi.conversion_factor, gi.base_received_qty
    FROM grn_items gi
    WHERE gi.grn_id = p_grn_id AND gi.accepted_qty > 0
  LOOP
    -- Base qty (in issue unit) for stock
    DECLARE
      v_base_qty numeric := COALESCE(r.base_received_qty, r.accepted_qty * COALESCE(r.conversion_factor, 1));
    BEGIN
      -- Insert into batch_stock
      INSERT INTO batch_stock (item_id, centre_id, batch_no, expiry_date, mrp, purchase_rate,
                                qty_available, grn_id, grn_date, manufacturer, storage_location)
      VALUES (r.item_id, v_centre_id, COALESCE(r.batch_no, 'NO-BATCH'), r.expiry_date, r.mrp,
              r.rate, v_base_qty, p_grn_id, v_grn_date, r.manufacturer, r.storage_location);

      -- Update aggregate stock
      INSERT INTO item_centre_stock (item_id, centre_id, current_stock, last_grn_date, last_grn_rate)
      VALUES (r.item_id, v_centre_id, v_base_qty, v_grn_date, r.rate)
      ON CONFLICT (item_id, centre_id) DO UPDATE SET
        current_stock = item_centre_stock.current_stock + v_base_qty,
        last_grn_date = v_grn_date,
        last_grn_rate = r.rate,
        updated_at = now();

      -- Get updated balance
      SELECT current_stock INTO v_current
        FROM item_centre_stock
        WHERE item_id = r.item_id AND centre_id = v_centre_id;

      -- Stock ledger with batch info
      INSERT INTO stock_ledger (centre_id, item_id, transaction_type, quantity, balance_after,
                                 reference_id, reference_number, batch_no, expiry_date, mrp, rate,
                                 unit, created_by)
      VALUES (v_centre_id, r.item_id, 'grn', v_base_qty, v_current,
              p_grn_id, v_grn_number, r.batch_no, r.expiry_date, r.mrp, r.rate,
              COALESCE(r.receipt_unit, 'NOS'), p_user_id);
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Done! Run this in Supabase SQL Editor after 001_schema.sql
-- ============================================================
