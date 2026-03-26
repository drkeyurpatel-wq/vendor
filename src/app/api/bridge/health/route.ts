import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBridge, bridgeSuccess, bridgeError } from '@/lib/bridge-auth'
import { withApiErrorHandler } from '@/lib/api-error-handler'

/**
 * Bridge Health Check
 * GET — returns VPMS status, table counts, last sync times
 * HMIS should call this periodically to verify bridge is alive.
 */
export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const authErr = validateBridge(request)
  if (authErr) return authErr

  const supabase = await createClient()

  const [
    { count: items },
    { count: vendors },
    { count: pos },
    { count: grns },
    { count: invoices },
    { count: consignmentDeposits },
    { count: consignmentUsage },
    { count: pendingConversions },
  ] = await Promise.all([
    supabase.from('items').select('*', { count: 'exact', head: true }),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }),
    supabase.from('grns').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('consignment_deposits').select('*', { count: 'exact', head: true }),
    supabase.from('consignment_usage').select('*', { count: 'exact', head: true }),
    supabase.from('consignment_usage').select('*', { count: 'exact', head: true }).eq('conversion_status', 'pending'),
  ])

  return bridgeSuccess('health', {
    status: 'healthy',
    vpms_version: '1.0.0',
    database: 'dwukvdtacwvnudqjlwrb',
    counts: {
      items: items ?? 0,
      vendors: vendors ?? 0,
      purchase_orders: pos ?? 0,
      grns: grns ?? 0,
      invoices: invoices ?? 0,
      consignment_deposits: consignmentDeposits ?? 0,
      consignment_usage: consignmentUsage ?? 0,
      pending_conversions: pendingConversions ?? 0,
    },
    bridge_endpoints: {
      health: '/api/bridge/health',
      billing_to_consignment: '/api/bridge/billing',
      pharmacy_indent: '/api/bridge/indent',
      ot_consumption: '/api/bridge/consumption',
      items_sync: '/api/bridge/items',
    },
  })
})
