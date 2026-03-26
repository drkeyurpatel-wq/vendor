import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowRightLeft, Plus, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react'
import { formatDate, formatLakhs } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-800' },
  dispatched: { label: 'Dispatched', color: 'bg-amber-100 text-amber-800' },
  received: { label: 'Received', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
}

export default async function SubStoreTransferListPage() {
  const { supabase, user, role, profile } = await requireAuth()

  const { data: transfers } = await supabase
    .from('stock_transfers')
    .select(`
      id, transfer_number, transfer_date, status, item_count, total_value, notes, created_at,
      from_sub:sub_stores!stock_transfers_from_sub_store_id_fkey(id, code, name, centre:centres(code)),
      to_sub:sub_stores!stock_transfers_to_sub_store_id_fkey(id, code, name, centre:centres(code))
    `)
    .not('from_sub_store_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  // Stats
  const all = transfers || []
  const requested = all.filter(t => t.status === 'requested').length
  const dispatched = all.filter(t => t.status === 'dispatched').length
  const received = all.filter(t => t.status === 'received').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sub-Store Transfers</h1>
          <p className="page-subtitle">Stock movements between sub-stores</p>
        </div>
        <Link href="/inventory/sub-store/transfer/new" className="btn-primary">
          <Plus size={16} /> New Transfer
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-xl font-bold text-navy-600">{all.length}</div>
        </div>
        <div className="card p-4 text-center border-blue-200">
          <div className="text-xs text-gray-500">Requested</div>
          <div className="text-xl font-bold text-blue-600">{requested}</div>
        </div>
        <div className="card p-4 text-center border-amber-200">
          <div className="text-xs text-gray-500">Dispatched</div>
          <div className="text-xl font-bold text-amber-600">{dispatched}</div>
        </div>
        <div className="card p-4 text-center border-green-200">
          <div className="text-xs text-gray-500">Received</div>
          <div className="text-xl font-bold text-green-600">{received}</div>
        </div>
      </div>

      {/* Transfer list */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Transfer #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">From</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">To</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Date</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {all.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No sub-store transfers yet
                  </td>
                </tr>
              ) : all.map((t: any) => {
                const fromSub = Array.isArray(t.from_sub) ? t.from_sub[0] : t.from_sub
                const toSub = Array.isArray(t.to_sub) ? t.to_sub[0] : t.to_sub
                const fromCentre = fromSub?.centre && (Array.isArray(fromSub.centre) ? fromSub.centre[0] : fromSub.centre)
                const toCentre = toSub?.centre && (Array.isArray(toSub.centre) ? toSub.centre[0] : toSub.centre)
                const status = STATUS_CONFIG[t.status] || STATUS_CONFIG.requested

                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/inventory/sub-store/transfer/${t.id}`}
                        className="text-sm font-semibold text-teal-600 hover:text-teal-800 hover:underline">
                        {t.transfer_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="font-medium">{fromSub?.name || '—'}</span>
                      {fromCentre && <span className="ml-1 text-xs text-gray-400">({fromCentre.code})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="font-medium">{toSub?.name || '—'}</span>
                      {toCentre && <span className="ml-1 text-xs text-gray-400">({toCentre.code})</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{t.item_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(t.transfer_date)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
