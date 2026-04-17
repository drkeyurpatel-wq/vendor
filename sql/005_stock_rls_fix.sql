-- ============================================================
-- H1 VPMS — Fix: Missing INSERT/UPDATE RLS on stock tables
-- 
-- Problem: item_centre_stock and stock_ledger have RLS enabled
--   but only SELECT policies exist. All stock writes from the
--   anon-key client (consumption, adjustments) silently fail.
--   GRN stock updates work only because update_stock_from_grn()
--   is SECURITY DEFINER.
--
-- This migration adds write policies so consumption deduction,
-- stock adjustments, and ledger entries work through the API.
--
-- Also ensures consumption_records has RLS + policies.
--
-- Safe to run multiple times (IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================

-- ─── item_centre_stock: allow INSERT + UPDATE for authenticated staff ───

DROP POLICY IF EXISTS "stock_insert" ON item_centre_stock;
CREATE POLICY "stock_insert" ON item_centre_stock FOR INSERT
  WITH CHECK (
    get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff')
  );

DROP POLICY IF EXISTS "stock_update" ON item_centre_stock;
CREATE POLICY "stock_update" ON item_centre_stock FOR UPDATE
  USING (
    get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff') AND
    (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id())
  )
  WITH CHECK (
    get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff') AND
    (get_my_role() IN ('group_admin','group_cao') OR centre_id = get_my_centre_id())
  );

-- ─── stock_ledger: allow INSERT for authenticated staff ─────────────────

DROP POLICY IF EXISTS "stock_ledger_insert" ON stock_ledger;
CREATE POLICY "stock_ledger_insert" ON stock_ledger FOR INSERT
  WITH CHECK (
    get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff')
  );

-- ─── consumption_records: ensure RLS + full access for staff ────────────

ALTER TABLE consumption_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consumption_records_read" ON consumption_records;
CREATE POLICY "consumption_records_read" ON consumption_records FOR SELECT
  USING (
    get_my_role() IN ('group_admin','group_cao') OR
    centre_id = get_my_centre_id()
  );

DROP POLICY IF EXISTS "consumption_records_insert" ON consumption_records;
CREATE POLICY "consumption_records_insert" ON consumption_records FOR INSERT
  WITH CHECK (
    get_my_role() IN ('group_admin','group_cao','unit_cao','store_staff')
  );

-- ─── Verify ─────────────────────────────────────────────────────────────

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('item_centre_stock', 'stock_ledger', 'consumption_records')
ORDER BY tablename, policyname;
