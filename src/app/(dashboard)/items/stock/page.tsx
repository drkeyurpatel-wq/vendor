import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, ShoppingCart, Layers } from 'lucide-react'

function getStockStatus(current: number, reorder: number): { label: string; class: string } {
  if (current <= 0) return { label: 'OUT', class: 'bg-red-100 text-red-800' }
  if (current <= reorder) return { label: 'LOW', class: 'bg-yellow-100 text-yellow-800' }
  return { label: 'OK', class: 'bg-green-100 text-green-800' }
}

function getExpiryClass(expiryDate: string | null): string {
  if (!expiryDate) return ''
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'text-red-600 font-bold'
  if (days <= 30) return 'text-red-500'
  if (days <= 90) return 'text-orange-500'
  return 'text-gray-600'
}

export default async function StockLevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ centre?: string; status?: string; view?: string; item?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const isBatchView = params.view === 'batch'

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  let query = supabase
    .from('item_centre_stock')
    .select('*, item:items(item_code, generic_name, unit, category:item_categories(name), abc_class, ved_class), centre:centres(code, name)', { count: 'exact' })
    .order('current_stock', { ascending: true })

  if (params.centre) query = query.eq('centre_id', params.centre)
  else if (profile?.centre_id && !['group_admin', 'group_cao'].includes(profile?.role || '')) {
    query = query.eq('centre_id', profile.centre_id)
  }

  const { data: stocks, count } = await query.limit(200)

  const [{ data: centres }] = await Promise.all([
    supabase.from('centres').select('id,code,name').eq('is_active', true).order('code'),
  ])

  // Fetch batch stock if batch view or item detail
  let batchStocks: any[] = []
  if (isBatchView || params.item) {
    let batchQuery = supabase
      .from('batch_stock')
      .select('*, item:items(item_code, generic_name), centre:centres(code, name)')
      .gt('available_qty', 0)
      .order('expiry_date', { ascending: true })

    if (params.centre) batchQuery = batchQuery.eq('centre_id', params.centre)
    if (params.item) batchQuery = batchQuery.eq('item_id', params.item)

    const { data: batches } = await batchQuery.limit(500)
    batchStocks = batches || []
  }

  // Filter by stock status
  let filteredStocks = stocks || []
  if (params.status === 'low') {
    filteredStocks = filteredStocks.filter((s: any) => s.current_stock > 0 && s.current_stock <= s.reorder_level)
  } else if (params.status === 'out') {
    filteredStocks = filteredStocks.filter((s: any) => s.current_stock <= 0)
  } else if (params.status === 'ok') {
    filteredStocks = filteredStocks.filter((s: any) => s.current_stock > s.reorder_level)
  }

  const lowCount = (stocks || []).filter((s: any) => s.current_stock > 0 && s.current_stock <= s.reorder_level).length
  const outCount = (stocks || []).filter((s: any) => s.current_stock <= 0).length

  const baseUrl = `/items/stock?${params.centre ? `centre=${params.centre}&` : ''}${params.status ? `status=${params.status}&` : ''}`

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Levels</h1>
          <p className="page-subtitle">{count ?? 0} items tracked</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/items/stock?${params.centre ? `centre=${params.centre}&` : ''}${params.status ? `status=${params.status}&` : ''}view=summary`}
            className={cn('btn-secondary text-sm', !isBatchView && 'bg-[#1B3A6B] text-white border-[#1B3A6B]')}
          >
            <Package size={14} /> Summary
          </Link>
          <Link
            href={`/items/stock?${params.centre ? `centre=${params.centre}&` : ''}${params.status ? `status=${params.status}&` : ''}view=batch`}
            className={cn('btn-secondary text-sm', isBatchView && 'bg-[#1B3A6B] text-white border-[#1B3A6B]')}
          >
            <Layers size={14} /> Batch-wise (FIFO)
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-gray-700">Out of Stock</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{outCount}</div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Low Stock</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{lowCount}</div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Total Items</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stocks?.length ?? 0}</div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href={`/items/stock?${params.centre ? `centre=${params.centre}&` : ''}${params.view ? `view=${params.view}` : ''}`}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            !params.status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200')}>
          All
        </Link>
        <Link href={`/items/stock?status=out${params.centre ? `&centre=${params.centre}` : ''}${params.view ? `&view=${params.view}` : ''}`}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            params.status === 'out' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200')}>
          Out of Stock
        </Link>
        <Link href={`/items/stock?status=low${params.centre ? `&centre=${params.centre}` : ''}${params.view ? `&view=${params.view}` : ''}`}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            params.status === 'low' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-gray-600 border-gray-200')}>
          Low Stock
        </Link>
        <Link href={`/items/stock?status=ok${params.centre ? `&centre=${params.centre}` : ''}${params.view ? `&view=${params.view}` : ''}`}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            params.status === 'ok' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200')}>
          OK
        </Link>
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && (
        <div className="mb-5 flex gap-2 flex-wrap">
          {centres?.map(c => (
            <Link key={c.id} href={`/items/stock?centre=${c.id}${params.status ? `&status=${params.status}` : ''}${params.view ? `&view=${params.view}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      {/* Batch-wise FIFO view */}
      {isBatchView ? (
        <div className="card overflow-hidden">
          {batchStocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Centre</th>
                    <th>Batch No</th>
                    <th>MFG Date</th>
                    <th>Expiry Date</th>
                    <th className="text-right">Available Qty</th>
                    <th className="text-right">Rate</th>
                    <th className="text-right">MRP</th>
                    <th>GRN</th>
                  </tr>
                </thead>
                <tbody>
                  {batchStocks.map((b: any, idx: number) => (
                    <tr key={b.id || idx}>
                      <td>
                        <div className="font-medium text-gray-900 text-sm">{b.item?.generic_name}</div>
                        <div className="font-mono text-xs text-gray-400">{b.item?.item_code}</div>
                      </td>
                      <td><span className="badge bg-blue-50 text-blue-700">{b.centre?.code}</span></td>
                      <td className="text-sm font-mono">{b.batch_number || '—'}</td>
                      <td className="text-sm text-gray-600">{b.mfg_date ? formatDate(b.mfg_date) : '—'}</td>
                      <td className={cn('text-sm', getExpiryClass(b.expiry_date))}>
                        {b.expiry_date ? formatDate(b.expiry_date) : '—'}
                        {b.expiry_date && (() => {
                          const days = Math.ceil((new Date(b.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          if (days <= 0) return <span className="ml-1 badge bg-red-100 text-red-800 text-[10px]">EXPIRED</span>
                          if (days <= 30) return <span className="ml-1 badge bg-red-50 text-red-700 text-[10px]">{days}d</span>
                          if (days <= 90) return <span className="ml-1 badge bg-orange-50 text-orange-700 text-[10px]">{days}d</span>
                          return null
                        })()}
                      </td>
                      <td className="text-right text-sm font-bold">{b.available_qty}</td>
                      <td className="text-right text-sm">{b.purchase_rate ? formatCurrency(b.purchase_rate) : '—'}</td>
                      <td className="text-right text-sm">{b.mrp ? formatCurrency(b.mrp) : '—'}</td>
                      <td className="text-sm text-[#0D7E8A]">
                        {b.grn_id ? <Link href={`/grn/${b.grn_id}`} className="hover:underline">View</Link> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Layers size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No batch stock data found</p>
              <p className="text-sm text-gray-400 mt-1">Batch stock is populated when GRNs are submitted</p>
            </div>
          )}
        </div>
      ) : (
        /* Summary view */
        <div className="card overflow-hidden">
          {filteredStocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Centre</th>
                    <th>ABC</th>
                    <th>VED</th>
                    <th className="text-right">Current Stock</th>
                    <th className="text-right">Reorder Level</th>
                    <th className="text-right">Max Level</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((s: any) => {
                    const status = getStockStatus(s.current_stock, s.reorder_level)
                    return (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/items/${s.item_id}`} className="hover:underline">
                            <div className="font-medium text-gray-900 text-sm">{s.item?.generic_name}</div>
                            <div className="font-mono text-xs text-gray-400">{s.item?.item_code}</div>
                          </Link>
                        </td>
                        <td className="text-sm text-gray-600">{s.item?.category?.name || '—'}</td>
                        <td><span className="badge bg-blue-50 text-blue-700">{s.centre?.code}</span></td>
                        <td>
                          {s.item?.abc_class && (
                            <span className={cn('badge text-xs',
                              s.item.abc_class === 'A' ? 'bg-red-50 text-red-700' :
                              s.item.abc_class === 'B' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-green-50 text-green-700'
                            )}>{s.item.abc_class}</span>
                          )}
                        </td>
                        <td>
                          {s.item?.ved_class && (
                            <span className={cn('badge text-xs',
                              s.item.ved_class === 'V' ? 'bg-red-50 text-red-700' :
                              s.item.ved_class === 'E' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-green-50 text-green-700'
                            )}>{s.item.ved_class}</span>
                          )}
                        </td>
                        <td className={cn('text-right text-sm font-bold', s.current_stock <= 0 ? 'text-red-600' : s.current_stock <= s.reorder_level ? 'text-yellow-600' : 'text-gray-900')}>
                          {s.current_stock} {s.item?.unit || ''}
                        </td>
                        <td className="text-right text-sm text-gray-600">{s.reorder_level}</td>
                        <td className="text-right text-sm text-gray-600">{s.max_level}</td>
                        <td><span className={cn('badge', status.class)}>{status.label}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <Link href={`/items/stock?view=batch&item=${s.item_id}${params.centre ? `&centre=${params.centre}` : ''}`}
                              className="text-xs text-[#0D7E8A] hover:underline font-medium">
                              <Layers size={13} className="inline mr-0.5" />Batches
                            </Link>
                            {(status.label === 'LOW' || status.label === 'OUT') && (
                              <Link href="/purchase-orders/new" className="text-xs text-[#0D7E8A] hover:underline font-medium">
                                <ShoppingCart size={13} className="inline mr-0.5" />PO
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Package size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No stock data found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
