-- Migration: Add short-close support to purchase_orders
-- Date: 2026-04-24
-- Description: Adds short_closed_at timestamp and short_close_reason to support
--              partial delivery workflow where PO is closed before full delivery.

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS short_closed_at TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS short_close_reason TEXT;

-- Unit conversion: default conversion factor on items (1 strip = X tablets)
-- Copies to PO/GRN line items when creating orders
ALTER TABLE items ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(15,3) DEFAULT 1;

COMMENT ON COLUMN purchase_orders.short_closed_at IS 'Timestamp when PO was short-closed by approver';
COMMENT ON COLUMN purchase_orders.short_close_reason IS 'Reason for short-closing: vendor unable to supply / no longer required / quality issue / alternate vendor sourced / budget constraints / other';
COMMENT ON COLUMN items.conversion_factor IS 'How many base units (unit field) per purchase unit. E.g., 1 strip = 10 tablets → conversion_factor = 10';
