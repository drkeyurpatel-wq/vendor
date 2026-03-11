import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  TrendingUp, Package, AlertTriangle, BarChart2, ArrowRight,
  Calendar, Target, ShoppingCart, Activity
} from 'lucide-react'
import ForecastingClient from './ForecastingClient'

export default async function ForecastingPage({
  searchParams,
}: {
  searchParams: Promise<{ item_id?: string; centre_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch centres for filter
  const { data: centres } = await supabase
    .from('centres')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  // Fetch items that need reordering (below reorder level)
  const centreFilter = params.centre_id || profile.centre_id
  let reorderQuery = supabase
    .from('item_centre_stock')
    .select(`
      *,
      item:items(id, item_code, generic_name, brand_name, lead_time_days, safety_stock, default_rate),
      centre:centres(id, code, name)
    `)
    .gt('reorder_level', 0)

  if (centreFilter) {
    reorderQuery = reorderQuery.eq('centre_id', centreFilter)
  }

  const { data: stockItems } = await reorderQuery.order('current_stock', { ascending: true }).limit(100)

  // Filter items below reorder level
  const reorderAlerts = (stockItems || []).filter(s => s.current_stock <= s.reorder_level)

  // Get selected item forecast data if item_id is provided
  let forecastData = null
  if (params.item_id) {
    const apiUrl = new URL('/api/forecasting', process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000')
    // We'll fetch this client-side instead for dynamic updates
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Demand Forecasting</h1>
          <p className="page-subtitle">AI-powered consumption prediction and reorder recommendations</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Need Reorder</p>
              <p className="text-2xl font-bold text-red-600">{reorderAlerts.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E6F5F6] flex items-center justify-center">
              <Package size={20} className="text-[#0D7E8A]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Items Tracked</p>
              <p className="text-2xl font-bold text-[#1B3A6B]">{stockItems?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Activity size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(stockItems || []).filter(s => s.current_stock <= s.safety_stock && s.current_stock > 0).length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Adequate Stock</p>
              <p className="text-2xl font-bold text-green-600">
                {(stockItems || []).filter(s => s.current_stock > s.reorder_level).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Centre Filter */}
      {profile.role && ['group_admin', 'group_cao'].includes(profile.role) && centres && (
        <div className="mb-5">
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/inventory/forecasting"
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                !params.centre_id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200'
              )}
            >
              All Centres
            </Link>
            {centres.map(c => (
              <Link
                key={c.id}
                href={`/inventory/forecasting?centre_id=${c.id}`}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  params.centre_id === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200'
                )}
              >
                {c.code}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Forecasting Client Component for item selection and forecast display */}
      <ForecastingClient centreId={params.centre_id || profile.centre_id || ''} />

      {/* Reorder Recommendations Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-[#1B3A6B] mb-4 flex items-center gap-2">
          <Target size={20} />
          Reorder Recommendations
        </h2>

        <div className="card overflow-hidden">
          {reorderAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Centre</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Safety Stock</th>
                    <th>Avg Daily Usage</th>
                    <th>Days of Stock</th>
                    <th>Lead Time</th>
                    <th>Last GRN</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderAlerts.map((stock: any) => {
                    const item = stock.item
                    const centre = stock.centre
                    const avgDaily = stock.avg_daily_consumption || 0
                    const daysOfStock = avgDaily > 0 ? Math.round(stock.current_stock / avgDaily) : null
                    const isCritical = stock.current_stock <= stock.safety_stock

                    return (
                      <tr key={stock.id} className={isCritical ? 'bg-red-50' : ''}>
                        <td>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {item?.item_code}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={`/inventory/forecasting?item_id=${item?.id}${params.centre_id ? `&centre_id=${params.centre_id}` : ''}`}
                            className="text-sm font-medium text-[#0D7E8A] hover:underline"
                          >
                            {item?.generic_name}
                          </Link>
                          {item?.brand_name && (
                            <div className="text-xs text-gray-400">{item.brand_name}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-blue-50 text-blue-700">{centre?.code}</span>
                        </td>
                        <td>
                          <span className={cn(
                            'font-semibold text-sm',
                            isCritical ? 'text-red-600' : 'text-yellow-600'
                          )}>
                            {stock.current_stock}
                          </span>
                        </td>
                        <td className="text-sm text-gray-600">{stock.reorder_level}</td>
                        <td className="text-sm text-gray-600">{stock.safety_stock}</td>
                        <td className="text-sm text-gray-600">{avgDaily > 0 ? avgDaily.toFixed(1) : '—'}</td>
                        <td>
                          {daysOfStock !== null ? (
                            <span className={cn(
                              'badge',
                              daysOfStock <= 3 ? 'bg-red-100 text-red-800' :
                              daysOfStock <= 7 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            )}>
                              {daysOfStock}d
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-sm text-gray-600">{stock.lead_time_days || item?.lead_time_days || '—'}d</td>
                        <td className="text-xs text-gray-500">
                          {stock.last_grn_date ? formatDate(stock.last_grn_date) : '—'}
                          {stock.last_grn_rate ? (
                            <div className="text-gray-400">{formatCurrency(stock.last_grn_rate)}</div>
                          ) : null}
                        </td>
                        <td>
                          <Link
                            href={`/purchase-orders/new?item_id=${item?.id}&centre_id=${stock.centre_id}`}
                            className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1 whitespace-nowrap"
                          >
                            <ShoppingCart size={12} />
                            Create Indent
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <TrendingUp size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">All items are adequately stocked</p>
              <p className="text-sm text-gray-400 mt-1">No items currently below reorder level</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
