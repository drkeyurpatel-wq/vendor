import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { ArrowLeftRight, Plus } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
import TransferActions from '@/components/ui/TransferActions'

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  received: 'bg-green-100 text-green-800',
  partial_received: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUSES = ['draft', 'approved', 'in_transit', 'received', 'partial_received', 'cancelled']

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'

export default async function StockTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles').select('role')
    .eq('id', (await supabase.auth.getUser()).data.user!.id).single()

  let query = supabase
    .from('stock_transfers')
    .select(
      '*, from_centre:centres!stock_transfers_from_centre_id_fkey(code, name), to_centre:centres!stock_transfers_to_centre_id_fkey(code, name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: transfers, count } = await query
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  // Summary stats
  const { count: totalCount } = await supabase
    .from('stock_transfers')
    .select('*', { count: 'exact', head: true })

  const { count: inTransitCount } = await supabase
    .from('stock_transfers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_transit')

  const { count: pendingCount } = await supabase
    .from('stock_transfers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')

  const { data: valueAgg } = await supabase
    .from('stock_transfers')
    .select('total_value')

  const totalValue = valueAgg?.reduce((sum: number, t: any) => sum + (t.total_value || 0), 0) ?? 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Transfers</h1>
          <p className="page-subtitle">{count ?? 0} transfers found</p>
        </div>
        <Link href="/inventory/transfers/new" className="btn-primary">
          <Plus size={16} /> New Transfer
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Transfers</p>
          <p className="text-2xl font-bold text-[#1B3A6B] mt-1">{totalCount ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Transit</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{inTransitCount ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{pendingCount ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</p>
          <p className="text-2xl font-bold text-[#0D7E8A] mt-1">{formatLakhs(totalValue)}</p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <Link
          href="/inventory/transfers"
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
            !params.status
              ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/inventory/transfers?status=${s}`}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
              params.status === s
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {transfers && transfers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer No</th>
                    <th>From Centre</th>
                    <th>To Centre</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t: any) => (
                    <tr key={t.id}>
                      <td>
                        <Link
                          href={`/inventory/transfers/${t.id}`}
                          className="font-mono text-xs font-semibold text-[#0D7E8A] hover:underline"
                        >
                          {t.transfer_number}
                        </Link>
                      </td>
                      <td>
                        <span className="badge bg-[#EEF2F9] text-[#1B3A6B]">
                          {t.from_centre?.code ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-[#EEF2F9] text-[#1B3A6B]">
                          {t.to_centre?.code ?? '—'}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {t.transfer_date ? formatDate(t.transfer_date) : '—'}
                      </td>
                      <td className="text-sm text-gray-700 font-medium">
                        {t.item_count ?? '—'}
                      </td>
                      <td className="text-sm font-semibold">
                        {t.total_value ? formatLakhs(t.total_value) : '—'}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            TRANSFER_STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {t.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {t.created_at ? formatDate(t.created_at) : '—'}
                      </td>
                      <td>
                        {profile && !['received', 'cancelled'].includes(t.status) && (
                          <TransferActions transferId={t.id} transferNumber={t.transfer_number || ''} currentStatus={t.status} userRole={profile.role} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </>
        ) : (
          <div className="empty-state">
            <ArrowLeftRight size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No stock transfers found</p>
            <p className="text-sm text-gray-400 mt-1">Create a transfer to move stock between centres</p>
            <Link href="/inventory/transfers/new" className="btn-primary mt-4">
              <Plus size={15} /> Create Transfer
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
