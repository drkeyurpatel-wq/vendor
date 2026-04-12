import { requireApiAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const { supabase } = await requireApiAuth()
  try {
    // Queue stats by status
    const { data: queueStats } = await supabase
      .from('tally_sync_queue')
      .select('status, entity_type')

    const stats = {
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      by_type: {} as Record<string, { pending: number; success: number; failed: number }>,
    }

    for (const row of queueStats || []) {
      const s = row.status as keyof typeof stats
      if (s in stats && typeof stats[s] === 'number') {
        (stats[s] as number)++
      }
      if (!stats.by_type[row.entity_type]) {
        stats.by_type[row.entity_type] = { pending: 0, success: 0, failed: 0 }
      }
      if (row.status === 'pending') stats.by_type[row.entity_type].pending++
      if (row.status === 'success') stats.by_type[row.entity_type].success++
      if (row.status === 'failed') stats.by_type[row.entity_type].failed++
    }

    // Recent sync logs
    const { data: recentLogs } = await supabase
      .from('tally_sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10)

    // Recent failed items
    const { data: failedItems } = await supabase
      .from('tally_sync_queue')
      .select('id, entity_type, entity_ref, error_message, retry_count, created_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(20)

    // Entity sync coverage
    const [
      { count: vendorsTotal },
      { count: vendorsSynced },
      { count: itemsTotal },
      { count: itemsSynced },
      { count: invoicesTotal },
      { count: invoicesSynced },
    ] = await Promise.all([
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
      supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null).not('tally_synced_at', 'is', null),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      supabase.from('items').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null).not('tally_synced_at', 'is', null),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'approved').not('tally_synced_at', 'is', null),
    ])

    // Config
    const { data: config } = await supabase
      .from('tally_company_config')
      .select('company_name, sync_enabled, last_sync_at, last_sync_status')
      .limit(1)
      .single()

    return NextResponse.json({
      config: config || null,
      stats,
      coverage: {
        vendors: { total: vendorsTotal || 0, synced: vendorsSynced || 0 },
        items: { total: itemsTotal || 0, synced: itemsSynced || 0 },
        invoices: { total: invoicesTotal || 0, synced: invoicesSynced || 0 },
      },
      recent_logs: recentLogs || [],
      failed_items: failedItems || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
