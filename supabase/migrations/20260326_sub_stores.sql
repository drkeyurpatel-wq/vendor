-- ============================================================
-- H1 VPMS — Sub-Store System
-- Each centre has sub-stores (Main, OT, Cathlab, ICU, CSSD, Ward)
-- GRN stock always lands in Main Store
-- Transfers require sender dispatch + receiver confirmation
-- ============================================================

-- 1. Sub-stores table
CREATE TABLE IF NOT EXISTS sub_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centre_id UUID NOT NULL REFERENCES centres(id),
  code TEXT NOT NULL,        -- MAIN, OT, CATH, ICU, CSSD, WARD
  name TEXT NOT NULL,        -- Main Store, OT Store, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(centre_id, code)
);

-- 2. Per-sub-store stock tracking
CREATE TABLE IF NOT EXISTS item_substore_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  sub_store_id UUID NOT NULL REFERENCES sub_stores(id),
  current_stock NUMERIC NOT NULL DEFAULT 0,
  reorder_level NUMERIC NOT NULL DEFAULT 0,
  max_level NUMERIC NOT NULL DEFAULT 0,
  last_transfer_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, sub_store_id)
);

-- 3. Add sub-store columns to stock_transfers
ALTER TABLE stock_transfers
  ADD COLUMN IF NOT EXISTS from_sub_store_id UUID REFERENCES sub_stores(id),
  ADD COLUMN IF NOT EXISTS to_sub_store_id UUID REFERENCES sub_stores(id);

-- 4. Add sub-store column to stock_ledger for granular audit
ALTER TABLE stock_ledger
  ADD COLUMN IF NOT EXISTS sub_store_id UUID REFERENCES sub_stores(id);

-- 5. Add sub_store_id to stock_transfer_items for per-item tracking
ALTER TABLE stock_transfer_items
  ADD COLUMN IF NOT EXISTS sub_store_id UUID REFERENCES sub_stores(id);

-- 6. Seed sub-stores for all active centres
-- Get centre IDs dynamically
DO $$
DECLARE
  c RECORD;
  store_defs TEXT[][] := ARRAY[
    ARRAY['MAIN', 'Main Store'],
    ARRAY['OT', 'OT Store'],
    ARRAY['CATH', 'Cathlab Store'],
    ARRAY['ICU', 'ICU Store'],
    ARRAY['CSSD', 'CSSD Store'],
    ARRAY['WARD', 'Ward Store']
  ];
  s TEXT[];
BEGIN
  FOR c IN SELECT id FROM centres WHERE is_active = true LOOP
    FOREACH s SLICE 1 IN ARRAY store_defs LOOP
      INSERT INTO sub_stores (centre_id, code, name)
      VALUES (c.id, s[1], s[2])
      ON CONFLICT (centre_id, code) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_sub_stores_centre ON sub_stores(centre_id);
CREATE INDEX IF NOT EXISTS idx_item_substore_stock_sub_store ON item_substore_stock(sub_store_id);
CREATE INDEX IF NOT EXISTS idx_item_substore_stock_item ON item_substore_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_sub ON stock_transfers(from_sub_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_sub ON stock_transfers(to_sub_store_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_sub_store ON stock_ledger(sub_store_id);

-- 8. RLS policies
ALTER TABLE sub_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_substore_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_stores_read" ON sub_stores FOR SELECT USING (true);
CREATE POLICY "sub_stores_admin" ON sub_stores FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('group_admin', 'group_cao'))
);

CREATE POLICY "item_substore_stock_read" ON item_substore_stock FOR SELECT USING (true);
CREATE POLICY "item_substore_stock_write" ON item_substore_stock FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager', 'store_staff'))
);
