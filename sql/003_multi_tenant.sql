-- ============================================================
-- 003: Multi-Tenant Infrastructure
-- Run this AFTER 002_hospital_grade_overhaul.sql
-- This adds tenant awareness WITHOUT altering existing tables
-- ============================================================

-- Tenant registry
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-safe identifier (e.g., 'health1', 'apollo')
  domain TEXT, -- custom domain if any
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1B3A6B',
  accent_color TEXT DEFAULT '#0D7E8A',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- feature flags, limits, etc.
  subscription_plan TEXT DEFAULT 'basic', -- basic, professional, enterprise
  max_centres INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant-user mapping (a user can belong to one tenant)
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID NOT NULL,
  is_owner BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Add tenant_id to core tables (ADD COLUMN only, never ALTER)
-- These are safe to add - nullable columns with no default
DO $$
BEGIN
  -- Only add if column doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'centres' AND column_name = 'tenant_id') THEN
    ALTER TABLE centres ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'tenant_id') THEN
    ALTER TABLE user_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'tenant_id') THEN
    ALTER TABLE vendors ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'tenant_id') THEN
    ALTER TABLE items ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'tenant_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grns' AND column_name = 'tenant_id') THEN
    ALTER TABLE grns ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tenant_id') THEN
    ALTER TABLE invoices ADD COLUMN tenant_id UUID REFERENCES tenants(id);
  END IF;
END $$;

-- Create indexes for tenant queries
CREATE INDEX IF NOT EXISTS idx_centres_tenant ON centres(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_tenant ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grns_tenant ON grns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);

-- RLS for tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant owners can view their tenant" ON tenants
  FOR SELECT USING (
    id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  );

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their tenant membership" ON tenant_users
  FOR SELECT USING (user_id = auth.uid());

-- Function to get current user's tenant
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Insert Health1 as the default tenant (for existing data migration)
INSERT INTO tenants (name, slug, domain, is_active, subscription_plan, max_centres, max_users)
VALUES ('Health1 Super Speciality Hospitals Pvt. Ltd.', 'health1', NULL, true, 'enterprise', 20, 200)
ON CONFLICT (slug) DO NOTHING;

-- NOTE: To migrate existing data, run:
-- UPDATE centres SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
-- UPDATE user_profiles SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
-- UPDATE vendors SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
-- UPDATE items SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
-- UPDATE purchase_orders SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
-- UPDATE grns SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
-- UPDATE invoices SET tenant_id = (SELECT id FROM tenants WHERE slug = 'health1');
