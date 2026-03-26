import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRightLeft, Package, AlertTriangle } from 'lucide-react'
import { formatLakhs } from '@/lib/utils'

export default async function SubStoreStockPage({ searchParams }: { searchParams: { centre?: string; store?: string } }) {
  const { supabase, user, role, profile } = await requireAuth()

  // Get centres and sub-stores
  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')
  const { data: subStores } = await supabase.from('sub_stores').select('id, centre_id, code, name').eq('is_active', true).order('code')

  const selectedCentreId = searchParams.centre || profile?.centre_id || centres?.[0]?.id
  const centreStores = subStores?.filter(s => s.centre_id === selectedCentreId) || []
  const selectedStoreId = searchParams.store || centreStores.find(s => s.code === 'MAIN')?.id || centreStores[0]?.id

  // Get stock for selected sub-store
  let stockData: any[] = []
  if (selectedStoreId) {
    const { data } = await supabase
      .from('item_substore_stock')
      .select('id, current_stock, reorder_level, max_level, last_transfer_date, updated_at, item:items(id, item_code, generic_name, unit)')
      .eq('sub_store_id', selectedStoreId)
      .gt('current_stock', 0)
      .order('current_stock', { ascending: true })

    stockData = data || []
  }

  // Stats
  const totalItems = stockData.length
  const totalValue = stockData.reduce((s, r) => s + r.current_stock, 0)
  const belowReorder = stockData.filter(r => r.reorder_level > 0 && r.current_stock <= r.reorder_level)
  const selectedStore = centreStores.find(s => s.id === selectedStoreId)
  const selectedCentre = centres?.find(c => c.id === selectedCentreId)

  // Pending transfers for this store (incoming)
  const { data: pendingIn } = selectedStoreId ? await supabase
    .from('stock_transfers')
    .select('id, transfer_number, status, item_count, from_sub:sub_stores!stock_transfers_from_sub_store_id_fkey(name)')
    .eq('to_sub_store_id', selectedStoreId)
    .eq('status', 'dispatched')
    .order('created_at', { ascending: false })
    .limit(5) : { data: null }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/items/stock" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Centre Stock
          </Link>
          <h1 className="page-title">Sub-Store Stock</h1>
          <p className="page-subtitle">Stock levels by sub-store within each centre</p>
        </div>
        <Link href="/inventory/transfers/new" className="btn-primary">
          <ArrowRightLeft size={16} /> New Transfer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {centres?.map(c => (
            <Link key={c.id}
              href={`/inventory/sub-store?centre=${c.id}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                c.id === selectedCentreId
                  ? 'bg-navy-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {c.code}
            </Link>
          ))}
        </div>
      </div>

      {/* Sub-store tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {centreStores.map(store => (
          <Link key={store.id}
            href={`/inventory/sub-store?centre=${selectedCentreId}&store=${store.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              store.id === selectedStoreId
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}>
            {store.name}
          </Link>
        ))}
      </div>

      {/* Pending incoming transfers banner */}
      {pendingIn && pendingIn.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">{pendingIn.length} incoming transfer(s) awaiting confirmation</span>
          </div>
          {pendingIn.map((t: any) => (
            <Link key={t.id} href={`/inventory/transfers/${t.id}`}
              className="block text-sm text-amber-700 hover:text-amber-900 hover:underline ml-6">
              {t.transfer_number} — {t.item_count} items from {(t.from_sub as any)?.name || 'unknown'}
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">Store</div>
          <div className="text-lg font-bold text-navy-600 mt-1">{selectedStore?.name || '—'}</div>
          <div className="text-xs text-gray-400">{selectedCentre?.name}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">Items in stock</div>
          <div className="text-lg font-bold text-teal-600 mt-1">{totalItems}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-gray-500">Total units</div>
          <div className="text-lg font-bold text-gray-900 mt-1">{totalValue.toLocaleString()}</div>
        </div>
        <div className={`card p-4 text-center ${belowReorder.length > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <div className="text-xs text-gray-500">Below reorder</div>
          <div className={`text-lg font-bold mt-1 ${belowReorder.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {belowReorder.length}
          </div>
        </div>
      </div>

      {/* Stock table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Item code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Unit</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Reorder</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-navy-700 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stockData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No stock in {selectedStore?.name || 'this sub-store'}. Transfer items from Main Store.
                  </td>
                </tr>
              ) : stockData.map((row: any) => {
                const item = Array.isArray(row.item) ? row.item[0] : row.item
                const isBelowReorder = row.reorder_level > 0 && row.current_stock <= row.reorder_level
                return (
                  <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${isBelowReorder ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{item?.item_code || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item?.generic_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item?.unit || '—'}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{row.current_stock}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{row.reorder_level || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {isBelowReorder ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                          <AlertTriangle size={10} /> Low
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">OK</span>
                      )}
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
