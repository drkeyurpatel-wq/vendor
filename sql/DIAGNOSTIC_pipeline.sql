-- ============================================================
-- VPMS PIPELINE DIAGNOSTIC
-- Run this ENTIRE script in Supabase SQL Editor
-- It will tell you exactly what's broken and what to fix
-- ============================================================

-- 1. USER PROFILES — Do you exist? Is your role correct?
SELECT '=== 1. USER PROFILES ===' as section;
SELECT id, full_name, email, role, centre_id, is_active
FROM user_profiles
ORDER BY created_at;

-- 2. Does get_my_role() work for your session?
SELECT '=== 2. get_my_role() CHECK ===' as section;
SELECT 
  auth.uid() as your_auth_uid,
  get_my_role() as your_role,
  get_my_centre_id() as your_centre_id;

-- 3. SEQUENCES — Do they exist?
SELECT '=== 3. SEQUENCES ===' as section;
SELECT sequencename, last_value, is_called
FROM pg_sequences
WHERE sequencename IN (
  'vendor_code_seq', 'item_code_seq', 'po_number_seq',
  'grn_number_seq', 'indent_number_seq', 'invoice_ref_seq', 'batch_number_seq'
);

-- 4. next_sequence_number FUNCTION — Does it exist?
SELECT '=== 4. FUNCTION CHECK ===' as section;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'next_sequence_number'
  AND routine_schema = 'public';

-- 5. RLS POLICIES on critical tables
SELECT '=== 5. RLS POLICIES ===' as section;
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('vendors', 'items', 'purchase_orders', 'purchase_order_items', 'grns', 'grn_items', 'invoices')
ORDER BY tablename, cmd;

-- 6. CENTRES — Do they exist?
SELECT '=== 6. CENTRES ===' as section;
SELECT id, code, name, is_active FROM centres ORDER BY code;

-- 7. VENDOR CATEGORIES — Are there any?
SELECT '=== 7. VENDOR CATEGORIES ===' as section;
SELECT id, name, code, is_active FROM vendor_categories ORDER BY name;

-- 8. ITEM CATEGORIES — Are there any?
SELECT '=== 8. ITEM CATEGORIES ===' as section;
SELECT id, name, code, is_active FROM item_categories ORDER BY name;

-- 9. PIPELINE COUNTS
SELECT '=== 9. PIPELINE COUNTS ===' as section;
SELECT 
  (SELECT count(*) FROM vendors WHERE deleted_at IS NULL) as vendors,
  (SELECT count(*) FROM items WHERE deleted_at IS NULL) as items,
  (SELECT count(*) FROM purchase_orders WHERE deleted_at IS NULL) as pos,
  (SELECT count(*) FROM grns) as grns,
  (SELECT count(*) FROM invoices) as invoices;

-- 10. TEST: Can you insert a vendor? (dry run via RLS check)
SELECT '=== 10. INSERT PERMISSION CHECK ===' as section;
SELECT 
  CASE WHEN get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager') 
    THEN 'YES — vendor insert allowed' 
    ELSE 'NO — role ' || COALESCE(get_my_role(), 'NULL') || ' cannot insert vendors' 
  END as can_insert_vendor,
  CASE WHEN get_my_role() IN ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff')
    THEN 'YES — GRN insert allowed'
    ELSE 'NO — role ' || COALESCE(get_my_role(), 'NULL') || ' cannot insert GRNs'
  END as can_insert_grn,
  CASE WHEN get_my_role() IN ('group_admin','group_cao','unit_cao','finance_staff')
    THEN 'YES — invoice insert allowed'
    ELSE 'NO — role ' || COALESCE(get_my_role(), 'NULL') || ' cannot insert invoices'
  END as can_insert_invoice;
