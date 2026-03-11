import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Package, AlertTriangle, ShoppingCart } from 'lucide-react'

function getStockStatus(current: number, reorder: number): { label: string; class: string } {
  if (current <= 0) return { label: 'OUT', class: 'bg-red-100 text-red-800' }
  if (current <= reorder) return { label: 'LOW', class: 'bg-yellow-100 text-yellow-800' }
  return { label: 'OK', class: 'bg-green-100 text-green-800' }
}

export default async function StockLevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ centre?: string; status?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  let query = supabase
    .from('item_centre_stock')
    .select('*, item:items(item_code, generic_name, category:item_categories(name)), centre:centres(code, name)', { count: 'exact' })
    .order('current_stock', { ascending: true })

  if (params.centre) query = query.eq('centre_id', params.centre)
  else if (profile?.centre_id && !['group_admin', 'group_cao'].includes(profile?.role || '')) {
    query = query.eq('centre_id', profile.centre_id)
  }

  const { data: stocks, count } = await query.limit(100)

  const [{ data: centres }, { data: categories }] = await Promise.all([
    supabase.from('centres').select('id,code,name').eq('is_active', true).order('code'),
    supabase.from('item_categories').select('id,name').eq('is_active', true).order('name'),
  ])

  // Filter by stock status client-side
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Levels</h1>
          <p className="page-subtitle">{count ?? 0} items tracked</p>
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

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/items/stock"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            !params.status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200')}>
          All
        </Link>
        <Link href="/items/stock?status=out"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            params.status === 'out' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200')}>
          Out of Stock
        </Link>
        <Link href="/items/stock?status=low"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            params.status === 'low' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-gray-600 border-gray-200')}>
          Low Stock
        </Link>
        <Link href="/items/stock?status=ok"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            params.status === 'ok' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200')}>
          OK
        </Link>
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && (
        <div className="mb-5 flex gap-2 flex-wrap">
          {centres?.map(c => (
            <Link key={c.id} href={`/items/stock?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        {filteredStocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Centre</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Max Level</th>
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
                        <div className="font-medium text-gray-900 text-sm">{s.item?.generic_name}</div>
                        <div className="font-mono text-xs text-gray-400">{s.item?.item_code}</div>
                      </td>
                      <td className="text-sm text-gray-600">{s.item?.category?.name || '—'}</td>
                      <td><span className="badge bg-blue-50 text-blue-700">{s.centre?.code}</span></td>
                      <td className={cn('text-sm font-bold', s.current_stock <= 0 ? 'text-red-600' : s.current_stock <= s.reorder_level ? 'text-yellow-600' : 'text-gray-900')}>
                        {s.current_stock}
                      </td>
                      <td className="text-sm text-gray-600">{s.reorder_level}</td>
                      <td className="text-sm text-gray-600">{s.max_level}</td>
                      <td><span className={cn('badge', status.class)}>{status.label}</span></td>
                      <td>
                        {(status.label === 'LOW' || status.label === 'OUT') && (
                          <Link href={`/purchase-orders/new`} className="text-xs text-[#0D7E8A] hover:underline font-medium">
                            <ShoppingCart size={13} className="inline mr-1" />Raise PO
                          </Link>
                        )}
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
    </div>
  )
}
