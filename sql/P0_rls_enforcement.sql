-- ============================================================
-- H1 VPMS — RLS ENFORCEMENT ON ALL TABLES
-- Run AFTER P0_go_live_migration.sql
-- 
-- Phase 1: Blocks unauthenticated API access.
--   All authenticated users get full access (app handles role checks).
--   Service role (used by the app) bypasses RLS automatically.
--
-- Phase 2 (when vendor portal goes live): Add vendor-specific
--   restrictions so vendor-role users only see their own data.
-- ============================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'centres','user_profiles','vendors','vendor_categories','vendor_documents','vendor_items',
    'items','item_categories','item_centre_stock',
    'purchase_orders','purchase_order_items','po_approvals',
    'purchase_indents','purchase_indent_items',
    'grns','grn_items','invoices',
    'payment_batches','payment_batch_items',
    'rate_contracts','rate_contract_items',
    'notifications','stock_ledger','vendor_performance'
  ])
  LOOP
    -- Enable RLS (idempotent)
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Drop + recreate policy (safe for re-run)
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_access_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "authenticated_access_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- Verify
SELECT tablename, policyname, cmd, roles 
FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
