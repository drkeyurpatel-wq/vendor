import { createClient, SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

/**
 * Service-role Supabase client for test data management.
 * Bypasses RLS — use only for setup/teardown.
 */
export function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for E2E tests'
    )
  }

  adminClient = createClient(url, key)
  return adminClient
}

// ─── Test Data Constants ─────────────────────────────────────

export const TEST_PREFIX = 'E2E_TEST_' as const
export const TEST_VENDOR_LEGAL_NAME = `${TEST_PREFIX}Vendor_${Date.now()}`
export const TEST_ITEM_NAME = `${TEST_PREFIX}Item_${Date.now()}`

// ─── Shared P2P pipeline state (set during test runs) ────────

export interface PipelineState {
  vendorId?: string
  vendorCode?: string
  itemId?: string
  itemCode?: string
  poId?: string
  poNumber?: string
  grnId?: string
  grnNumber?: string
  invoiceId?: string
  invoiceRef?: string
  centreId?: string
  centreCode?: string
}

export const pipeline: PipelineState = {}

// ─── Setup helpers ───────────────────────────────────────────

/** Get the first active centre (for creating POs, GRNs, etc.) */
export async function getFirstCentre(): Promise<{ id: string; code: string; name: string }> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('centres')
    .select('id, code, name')
    .eq('is_active', true)
    .order('name')
    .limit(1)
    .single()

  if (error || !data) throw new Error(`No active centre found: ${error?.message}`)
  return data
}

/** Get an active vendor category */
export async function getFirstCategory(): Promise<{ id: string; name: string }> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('vendor_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
    .limit(1)
    .single()

  if (error || !data) throw new Error(`No active category found: ${error?.message}`)
  return data
}

/** Get existing items for PO creation */
export async function getActiveItems(limit = 3): Promise<Array<{ id: string; item_code: string; name: string; unit: string }>> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('items')
    .select('id, item_code, name, unit')
    .eq('is_active', true)
    .limit(limit)

  if (error || !data?.length) throw new Error(`No active items found: ${error?.message}`)
  return data
}

/** Get POs that are approved and have items for GRN testing */
export async function getApprovedPO(): Promise<{ id: string; po_number: string } | null> {
  const admin = getAdminClient()
  const { data } = await admin
    .from('purchase_orders')
    .select('id, po_number')
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

// ─── Teardown helpers ────────────────────────────────────────

/** Remove all test data created during E2E runs */
export async function cleanupTestData(): Promise<void> {
  const admin = getAdminClient()

  // Delete in reverse dependency order: invoices → GRNs → PO items → POs → items → vendors
  // Only delete records with E2E_TEST_ prefix

  // Soft-delete invoices linked to test POs
  if (pipeline.poId) {
    await admin
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('po_id', pipeline.poId)
  }

  // Soft-delete GRNs linked to test POs
  if (pipeline.poId) {
    await admin
      .from('grns')
      .update({ deleted_at: new Date().toISOString() })
      .eq('po_id', pipeline.poId)
  }

  // Soft-delete test POs
  if (pipeline.poId) {
    await admin
      .from('purchase_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', pipeline.poId)
  }

  // Soft-delete test vendors by prefix
  await admin
    .from('vendors')
    .update({ deleted_at: new Date().toISOString() })
    .like('legal_name', `${TEST_PREFIX}%`)

  // Soft-delete test items by prefix
  await admin
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .like('name', `${TEST_PREFIX}%`)

  console.log('[E2E Cleanup] Test data soft-deleted')
}
