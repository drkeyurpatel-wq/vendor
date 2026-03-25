-- ============================================================
-- VPMS PIPELINE FIX — Run AFTER diagnostic to fix issues
-- Safe to run multiple times (all IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- 1. CREATE SEQUENCES (if missing)
CREATE SEQUENCE IF NOT EXISTS vendor_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS item_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS grn_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS indent_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_ref_seq START 1;
CREATE SEQUENCE IF NOT EXISTS batch_number_seq START 1;

-- 2. Advance sequences past existing records (prevent duplicates)
DO $$
DECLARE
  v_count bigint;
BEGIN
  SELECT count(*) INTO v_count FROM vendors WHERE deleted_at IS NULL;
  IF v_count > 0 THEN PERFORM setval('vendor_code_seq', v_count, true); END IF;

  SELECT count(*) INTO v_count FROM items WHERE deleted_at IS NULL;
  IF v_count > 0 THEN PERFORM setval('item_code_seq', v_count, true); END IF;

  SELECT count(*) INTO v_count FROM purchase_orders WHERE deleted_at IS NULL;
  IF v_count > 0 THEN PERFORM setval('po_number_seq', v_count, true); END IF;

  SELECT count(*) INTO v_count FROM grns;
  IF v_count > 0 THEN PERFORM setval('grn_number_seq', v_count, true); END IF;

  SELECT count(*) INTO v_count FROM purchase_indents;
  IF v_count > 0 THEN PERFORM setval('indent_number_seq', v_count, true); END IF;

  SELECT count(*) INTO v_count FROM invoices;
  IF v_count > 0 THEN PERFORM setval('invoice_ref_seq', v_count, true); END IF;

  SELECT count(*) INTO v_count FROM payment_batches;
  IF v_count > 0 THEN PERFORM setval('batch_number_seq', v_count, true); END IF;
END $$;

-- 3. CREATE/REPLACE the sequence function
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
    ELSE RETURN seq_val::text;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREATE/REPLACE stock update function
CREATE OR REPLACE FUNCTION update_stock_from_grn(p_grn_id uuid, p_user_id uuid)
RETURNS void AS $$
DECLARE
  r record;
  v_centre_id uuid;
  v_grn_number text;
  v_current numeric;
BEGIN
  SELECT centre_id, grn_number INTO v_centre_id, v_grn_number
    FROM grns WHERE id = p_grn_id;

  FOR r IN
    SELECT item_id, accepted_qty, rate
    FROM grn_items
    WHERE grn_id = p_grn_id AND accepted_qty > 0
  LOOP
    INSERT INTO item_centre_stock (item_id, centre_id, current_stock, last_grn_date, last_grn_rate)
    VALUES (r.item_id, v_centre_id, r.accepted_qty, current_date, r.rate)
    ON CONFLICT (item_id, centre_id) DO UPDATE SET
      current_stock = item_centre_stock.current_stock + r.accepted_qty,
      last_grn_date = current_date,
      last_grn_rate = r.rate,
      updated_at = now();

    SELECT current_stock INTO v_current
      FROM item_centre_stock
      WHERE item_id = r.item_id AND centre_id = v_centre_id;

    INSERT INTO stock_ledger (centre_id, item_id, transaction_type, quantity, balance_after, reference_id, reference_number, created_by)
    VALUES (v_centre_id, r.item_id, 'grn', r.accepted_qty, v_current, p_grn_id, v_grn_number, p_user_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. VERIFY — Quick test
SELECT next_sequence_number('vendor_code_seq', 'vendor', 'XXX') as test_vendor_code;

SELECT '✅ All fixes applied successfully' as result;
