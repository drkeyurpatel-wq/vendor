import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Package, AlertTriangle, Thermometer, Pill, ShieldAlert } from 'lucide-react'

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('items')
    .select('*, category:item_categories(name, code)')
    .eq('id', id)
    .single()

  if (!item || error) redirect('/items')

  // Fetch stock levels and vendor mappings in parallel
  const [{ data: stockLevels }, { data: vendorItems }] = await Promise.all([
    supabase
      .from('item_centre_stock')
      .select('*, centre:centres(code, name)')
      .eq('item_id', id)
      .order('centre_id'),
    supabase
      .from('vendor_items')
      .select('*, vendor:vendors(vendor_code, legal_name, status)')
      .eq('item_id', id)
      .order('l_rank', { ascending: true }),
  ])

  const totalStock = stockLevels?.reduce((s, sl: any) => s + (sl.current_stock || 0), 0) ?? 0
  const lowStockCentres = stockLevels?.filter((sl: any) => sl.current_stock <= sl.reorder_level).length ?? 0

  return (
    <div>
      <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Items
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-gray-500">{item.item_code}</span>
              <span className={cn('badge', item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1B3A6B]">{item.generic_name}</h1>
            {item.brand_name && <p className="text-gray-500 mt-0.5">Brand: {item.brand_name}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {item.category && <span className="badge bg-blue-50 text-blue-700">{item.category.name}</span>}
              <span className="badge bg-gray-100 text-gray-700">Unit: {item.unit}</span>
              <span className="badge bg-gray-100 text-gray-700">GST: {item.gst_percent}%</span>
              {item.hsn_code && <span className="badge bg-gray-100 text-gray-600">HSN: {item.hsn_code}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/purchase-orders/new`} className="btn-primary">
              <Package size={15} /> Create PO
            </Link>
          </div>
        </div>

        {/* Flags */}
        {(item.is_cold_chain || item.is_narcotic || item.is_high_alert) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            {item.is_cold_chain && (
              <span className="badge bg-cyan-100 text-cyan-800 flex items-center gap-1">
                <Thermometer size={12} /> Cold Chain
              </span>
            )}
            {item.is_narcotic && (
              <span className="badge bg-purple-100 text-purple-800 flex items-center gap-1">
                <Pill size={12} /> Narcotic
              </span>
            )}
            {item.is_high_alert && (
              <span className="badge bg-red-100 text-red-800 flex items-center gap-1">
                <ShieldAlert size={12} /> High Alert
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-sm text-gray-500">Total Stock (All Centres)</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{totalStock} {item.unit}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Centres Stocking</div>
          <div className="text-xl font-bold text-[#0D7E8A]">{stockLevels?.length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Low Stock Centres</div>
          <div className={cn('text-xl font-bold', lowStockCentres > 0 ? 'text-red-600' : 'text-green-600')}>
            {lowStockCentres}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Approved Vendors</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{vendorItems?.length ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Item Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Item Code:</span><span className="font-mono font-medium">{item.item_code}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Generic Name:</span><span className="font-medium text-gray-900">{item.generic_name}</span></div>
            {item.brand_name && <div className="flex justify-between"><span className="text-gray-500">Brand Name:</span><span>{item.brand_name}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Category:</span><span>{item.category?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Unit:</span><span>{item.unit}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">HSN Code:</span><span className="font-mono">{item.hsn_code || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST Rate:</span><span>{item.gst_percent}%</span></div>
            {item.shelf_life_days && <div className="flex justify-between"><span className="text-gray-500">Shelf Life:</span><span>{item.shelf_life_days} days</span></div>}
            {item.ecw_item_code && <div className="flex justify-between"><span className="text-gray-500">eCW Code:</span><span className="font-mono">{item.ecw_item_code}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Created:</span><span>{formatDate(item.created_at)}</span></div>
          </div>
        </div>

        {/* Vendor Rankings (L1/L2/L3) */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Approved Vendors (L-Rank)</h2>
          </div>
          {vendorItems && vendorItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Rank</th><th>Vendor</th><th>Last Rate</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {vendorItems.map((vi: any) => (
                    <tr key={vi.id}>
                      <td>
                        <span className={cn('badge',
                          vi.l_rank === 1 ? 'bg-green-100 text-green-800' :
                          vi.l_rank === 2 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          L{vi.l_rank}
                        </span>
                      </td>
                      <td>
                        <Link href={`/vendors/${vi.vendor?.id || vi.vendor_id}`} className="text-[#0D7E8A] hover:underline font-medium text-sm">
                          {vi.vendor?.legal_name}
                        </Link>
                        <div className="font-mono text-xs text-gray-400">{vi.vendor?.vendor_code}</div>
                      </td>
                      <td className="text-sm font-medium">{vi.last_quoted_rate ? formatCurrency(vi.last_quoted_rate) : '—'}</td>
                      <td>
                        <span className={cn('badge',
                          vi.vendor?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {vi.vendor?.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No vendor mappings yet</div>
          )}
        </div>
      </div>

      {/* Stock Levels by Centre */}
      <div className="card overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-[#0D7E8A]" />
          <h2 className="font-semibold text-gray-900">Stock Levels by Centre</h2>
        </div>
        {stockLevels && stockLevels.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Max Level</th>
                  <th>Status</th>
                  <th>Last GRN</th>
                  <th>Last Rate</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((sl: any) => {
                  const isOut = sl.current_stock <= 0
                  const isLow = sl.current_stock > 0 && sl.current_stock <= sl.reorder_level
                  return (
                    <tr key={sl.id}>
                      <td><span className="badge bg-blue-50 text-blue-700">{sl.centre?.code} — {sl.centre?.name}</span></td>
                      <td className={cn('text-sm font-bold', isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900')}>
                        {sl.current_stock} {item.unit}
                      </td>
                      <td className="text-sm text-gray-600">{sl.reorder_level}</td>
                      <td className="text-sm text-gray-600">{sl.max_level}</td>
                      <td>
                        <span className={cn('badge',
                          isOut ? 'bg-red-100 text-red-800' :
                          isLow ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        )}>
                          {isOut ? 'OUT' : isLow ? 'LOW' : 'OK'}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{sl.last_grn_date ? formatDate(sl.last_grn_date) : '—'}</td>
                      <td className="text-sm">{sl.last_grn_rate ? formatCurrency(sl.last_grn_rate) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            <AlertTriangle size={20} className="mx-auto mb-2 text-gray-300" />
            No stock records — item has not been received at any centre yet
          </div>
        )}
      </div>
    </div>
  )
}
