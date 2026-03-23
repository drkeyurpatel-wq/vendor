-- ============================================================
-- H1 VPMS — P0 GO-LIVE MIGRATION
-- Combines: 002_hospital_grade_overhaul + missing tables + RLS
-- Safe to re-run (all IF NOT EXISTS / IF EXISTS checks)
-- Run in Supabase SQL Editor → dwukvdtacwvnudqjlwrb
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ITEMS — Add missing columns (40+ columns)
-- ============================================================

ALTER TABLE items ADD COLUMN IF NOT EXISTS manufacturer text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS marketed_by text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS dosage_form text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS route_of_administration text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS specification text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS strength text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS therapeutic_class text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS department text DEFAULT 'Medical';
ALTER TABLE items ADD COLUMN IF NOT EXISTS major_group text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS minor_group text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_type text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS combination_of_drugs text;

-- Unit hierarchy
ALTER TABLE items ADD COLUMN IF NOT EXISTS unit_levels integer DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS level1_unit text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS level1_qty_per_unit numeric(15,3) DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS level2_unit text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS level2_qty_per_unit numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS level3_unit text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS level3_qty_per_unit numeric(15,3);
ALTER TABLE items ADD COLUMN IF NOT EXISTS purchase_unit text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS receipt_unit text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS issue_unit text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS qty_conversion numeric(15,3) DEFAULT 1;

-- ABC-VED-FSN
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_nature_abc text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_nature_ved text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS item_nature_fsn text;

-- Drug flags
ALTER TABLE items ADD COLUMN IF NOT EXISTS scheduled_drug boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS scheduled_drug_category text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_high_risk boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_dpco boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_look_alike boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_sound_alike boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_consignment boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_capital_goods boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_emergency_drug boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_hazardous boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_imported boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_immunization boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_refrigerated boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_cssd_item boolean DEFAULT false;

-- Misc
ALTER TABLE items ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS alternate_barcode text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS snomed_ct_code text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS ndc_code text;
ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 2. PURCHASE ORDERS — Add missing columns
-- ============================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supply_type text DEFAULT 'intra_state';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_acknowledged boolean DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_acknowledged_at timestamptz;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_confirmed_delivery_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_notes text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_dispute boolean DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_dispute_reason text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_dispute_at timestamptz;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS sent_to_vendor_at timestamptz;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS freight_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS loading_charges numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS insurance_charges numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS other_charges numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_applicable boolean DEFAULT false;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_section text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tds_rate numeric(5,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quotation_ref text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quotation_date date;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_and_conditions text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_instructions text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 3. PURCHASE ORDER ITEMS — Add missing columns
-- ============================================================

ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS free_qty numeric(15,3) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS net_rate numeric(15,4);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS mrp numeric(15,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cash_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS special_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cgst_percent numeric(5,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS sgst_percent numeric(5,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS igst_percent numeric(5,2);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS manufacturer text;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS contract_rate numeric(15,4);

-- ============================================================
-- 4. GRNS — Add missing columns
-- ============================================================

ALTER TABLE grns ADD COLUMN IF NOT EXISTS quality_status text DEFAULT 'pending';
ALTER TABLE grns ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS qc_checked_by uuid REFERENCES auth.users(id);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS qc_completed_at timestamptz;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS is_return_generated boolean DEFAULT false;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS net_amount numeric(15,2);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS total_amount numeric(15,2);
ALTER TABLE grns ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE grns ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE grns ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================================================
-- 5. GRN ITEMS — Add missing columns
-- ============================================================

ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS received_qty numeric(15,3);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS accepted_qty numeric(15,3);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS rejected_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS damaged_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS short_qty numeric(15,3) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS rate numeric(15,4);
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS batch_number text;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS manufacture_date date;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS cgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS sgst_amount numeric(15,2) DEFAULT 0;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS igst_amount numeric(15,2) DEFAULT 0;

-- ============================================================
-- 6. INVOICES — Add missing columns
-- ============================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS dispute_reason text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS disputed_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS match_details jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 7. VENDORS — Add missing columns
-- ============================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_type text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS msme_category text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS msme_registration_no text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tds_applicable boolean DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tds_section text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tds_rate numeric(5,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trade_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cash_discount_percent numeric(5,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_centres uuid[];
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fssai_no text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 8. ITEM CENTRE STOCK — Add missing columns
-- ============================================================

ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS last_grn_date date;
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS last_grn_rate numeric(15,4);
ALTER TABLE item_centre_stock ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 9. CREATE MISSING TABLES
-- ============================================================

-- Audit Logs (referenced by ALL action components)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text,
  action text NOT NULL,
  details jsonb,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id),
  centre_id uuid REFERENCES centres(id),
  adjustment_type text NOT NULL,
  quantity numeric(15,3) NOT NULL,
  reason text,
  previous_stock numeric(15,3),
  new_stock numeric(15,3),
  adjusted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Invoice Items (line-level for GST compliance)
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  po_item_id uuid,
  grn_item_id uuid,
  description text,
  hsn_code text,
  quantity numeric(15,3),
  rate numeric(15,4),
  taxable_amount numeric(15,2),
  cgst_percent numeric(5,2),
  cgst_amount numeric(15,2),
  sgst_percent numeric(5,2),
  sgst_amount numeric(15,2),
  igst_percent numeric(5,2),
  igst_amount numeric(15,2),
  total_amount numeric(15,2),
  created_at timestamptz DEFAULT now()
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number text UNIQUE,
  from_centre_id uuid REFERENCES centres(id),
  to_centre_id uuid REFERENCES centres(id),
  transfer_date date,
  status text DEFAULT 'draft',
  item_count integer DEFAULT 0,
  total_value numeric(15,2) DEFAULT 0,
  notes text,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  received_at timestamptz,
  received_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stock Transfer Items
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES stock_transfers(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  requested_qty numeric(15,3),
  dispatched_qty numeric(15,3),
  received_qty numeric(15,3),
  unit text,
  rate numeric(15,4),
  batch_number text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Batch Stock (for FEFO expiry tracking)
CREATE TABLE IF NOT EXISTS batch_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id),
  centre_id uuid REFERENCES centres(id),
  batch_number text,
  expiry_date date,
  manufacture_date date,
  grn_id uuid REFERENCES grns(id),
  qty_received numeric(15,3) DEFAULT 0,
  qty_issued numeric(15,3) DEFAULT 0,
  qty_available numeric(15,3) DEFAULT 0,
  rate numeric(15,4),
  mrp numeric(15,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, centre_id, batch_number)
);

-- Debit Notes
CREATE TABLE IF NOT EXISTS debit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_number text UNIQUE,
  vendor_id uuid REFERENCES vendors(id),
  centre_id uuid REFERENCES centres(id),
  invoice_id uuid REFERENCES invoices(id),
  grn_id uuid REFERENCES grns(id),
  reason text NOT NULL,
  subtotal numeric(15,2),
  gst_amount numeric(15,2),
  total_amount numeric(15,2),
  status text DEFAULT 'draft',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Debit Note Items
CREATE TABLE IF NOT EXISTS debit_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debit_note_id uuid REFERENCES debit_notes(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  quantity numeric(15,3),
  rate numeric(15,4),
  gst_percent numeric(5,2),
  gst_amount numeric(15,2),
  total_amount numeric(15,2),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number text UNIQUE,
  vendor_id uuid REFERENCES vendors(id),
  centre_id uuid REFERENCES centres(id),
  invoice_id uuid REFERENCES invoices(id),
  reason text NOT NULL,
  subtotal numeric(15,2),
  gst_amount numeric(15,2),
  total_amount numeric(15,2),
  status text DEFAULT 'draft',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- GRN Returns
CREATE TABLE IF NOT EXISTS grn_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE,
  grn_id uuid REFERENCES grns(id),
  vendor_id uuid REFERENCES vendors(id),
  centre_id uuid REFERENCES centres(id),
  reason text NOT NULL,
  status text DEFAULT 'draft',
  total_amount numeric(15,2),
  debit_note_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- GRN Return Items
CREATE TABLE IF NOT EXISTS grn_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES grn_returns(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id),
  grn_item_id uuid,
  return_qty numeric(15,3),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Document alert columns
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS review_status text;
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS snooze_until timestamptz;
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS alert_dismissed boolean DEFAULT false;
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS expires_at date;
ALTER TABLE vendor_documents ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Rate contract columns
ALTER TABLE rate_contracts ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE rate_contracts ADD COLUMN IF NOT EXISTS termination_reason text;
ALTER TABLE rate_contracts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_return_items ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API operations)

-- Authenticated users can read/write based on role (handled by app-level checks)

COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'audit_logs' as tbl, count(*) FROM audit_logs
UNION ALL SELECT 'stock_adjustments', count(*) FROM stock_adjustments
UNION ALL SELECT 'invoice_items', count(*) FROM invoice_items
UNION ALL SELECT 'stock_transfers', count(*) FROM stock_transfers
UNION ALL SELECT 'batch_stock', count(*) FROM batch_stock
UNION ALL SELECT 'debit_notes', count(*) FROM debit_notes
UNION ALL SELECT 'credit_notes', count(*) FROM credit_notes
UNION ALL SELECT 'grn_returns', count(*) FROM grn_returns
ORDER BY tbl;
-- RLS Policies (safe for re-run via DO block)
DO $$ 
BEGIN
  -- Drop and recreate is safer than IF NOT EXISTS (which doesn't exist for policies)
  DROP POLICY IF EXISTS "service_role_all_audit_logs" ON audit_logs;
  CREATE POLICY "service_role_all_audit_logs" ON audit_logs FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_audit_logs" ON audit_logs;
  CREATE POLICY "auth_all_audit_logs" ON audit_logs FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_stock_adjustments" ON stock_adjustments;
  CREATE POLICY "service_role_all_stock_adjustments" ON stock_adjustments FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_stock_adjustments" ON stock_adjustments;
  CREATE POLICY "auth_all_stock_adjustments" ON stock_adjustments FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_invoice_items" ON invoice_items;
  CREATE POLICY "service_role_all_invoice_items" ON invoice_items FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_invoice_items" ON invoice_items;
  CREATE POLICY "auth_all_invoice_items" ON invoice_items FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_stock_transfers" ON stock_transfers;
  CREATE POLICY "service_role_all_stock_transfers" ON stock_transfers FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_stock_transfers" ON stock_transfers;
  CREATE POLICY "auth_all_stock_transfers" ON stock_transfers FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_stock_transfer_items" ON stock_transfer_items;
  CREATE POLICY "service_role_all_stock_transfer_items" ON stock_transfer_items FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_stock_transfer_items" ON stock_transfer_items;
  CREATE POLICY "auth_all_stock_transfer_items" ON stock_transfer_items FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_batch_stock" ON batch_stock;
  CREATE POLICY "service_role_all_batch_stock" ON batch_stock FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_batch_stock" ON batch_stock;
  CREATE POLICY "auth_all_batch_stock" ON batch_stock FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_debit_notes" ON debit_notes;
  CREATE POLICY "service_role_all_debit_notes" ON debit_notes FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_debit_notes" ON debit_notes;
  CREATE POLICY "auth_all_debit_notes" ON debit_notes FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_debit_note_items" ON debit_note_items;
  CREATE POLICY "service_role_all_debit_note_items" ON debit_note_items FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_debit_note_items" ON debit_note_items;
  CREATE POLICY "auth_all_debit_note_items" ON debit_note_items FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_credit_notes" ON credit_notes;
  CREATE POLICY "service_role_all_credit_notes" ON credit_notes FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_credit_notes" ON credit_notes;
  CREATE POLICY "auth_all_credit_notes" ON credit_notes FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_grn_returns" ON grn_returns;
  CREATE POLICY "service_role_all_grn_returns" ON grn_returns FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_grn_returns" ON grn_returns;
  CREATE POLICY "auth_all_grn_returns" ON grn_returns FOR ALL TO authenticated USING (true);

  DROP POLICY IF EXISTS "service_role_all_grn_return_items" ON grn_return_items;
  CREATE POLICY "service_role_all_grn_return_items" ON grn_return_items FOR ALL TO service_role USING (true);
  DROP POLICY IF EXISTS "auth_all_grn_return_items" ON grn_return_items;
  CREATE POLICY "auth_all_grn_return_items" ON grn_return_items FOR ALL TO authenticated USING (true);
END $$;

-- ============================================================
-- VERIFICATION — run this after to confirm everything exists
-- ============================================================
SELECT 'audit_logs' as tbl, count(*) FROM audit_logs
UNION ALL SELECT 'stock_adjustments', count(*) FROM stock_adjustments
UNION ALL SELECT 'invoice_items', count(*) FROM invoice_items
UNION ALL SELECT 'stock_transfers', count(*) FROM stock_transfers
UNION ALL SELECT 'batch_stock', count(*) FROM batch_stock
UNION ALL SELECT 'debit_notes', count(*) FROM debit_notes
UNION ALL SELECT 'credit_notes', count(*) FROM credit_notes
UNION ALL SELECT 'grn_returns', count(*) FROM grn_returns
ORDER BY tbl;

-- Check PO columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'purchase_orders' AND column_name IN ('priority','supply_type','cancelled_at','freight_amount','payment_terms')
ORDER BY column_name;
