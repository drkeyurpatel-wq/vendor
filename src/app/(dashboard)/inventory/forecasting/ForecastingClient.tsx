'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import { Search, TrendingUp, BarChart2, ArrowDown, ArrowUp, Minus, Loader2 } from 'lucide-react'
import type { DemandForecast } from '@/lib/forecasting'

interface ForecastingClientProps {
  centreId: string
}

export default function ForecastingClient({ centreId }: ForecastingClientProps) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [forecast, setForecast] = useState<DemandForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  async function searchItems(term: string) {
    setQuery(term)
    if (term.length < 2) { setItems([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('items')
      .select('id, item_code, generic_name, brand_name')
      .or(`generic_name.ilike.%${term}%,item_code.ilike.%${term}%,brand_name.ilike.%${term}%`)
      .eq('is_active', true)
      .limit(10)
    setItems(data || [])
    setSearching(false)
  }

  async function loadForecast(item: any) {
    setSelectedItem(item)
    setItems([])
    setQuery(item.generic_name)
    setLoading(true)

    try {
      // Fetch stock_ledger for last 12 months
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

      let stockQuery = supabase
        .from('stock_ledger')
        .select('quantity, created_at')
        .eq('item_id', item.id)
        .eq('movement_type', 'issue')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: true })

      if (centreId) {
        stockQuery = stockQuery.eq('centre_id', centreId)
      }

      const { data: ledger } = await stockQuery

      // Aggregate by month
      const monthlyMap = new Map<string, number>()
      for (let i = 11; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyMap.set(key, 0)
      }

      ;(ledger || []).forEach(entry => {
        const d = new Date(entry.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + Math.abs(entry.quantity))
      })

      const historical = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, qty]) => ({ month, qty }))

      // Get current stock
      let stockData: any = null
      if (centreId) {
        const { data } = await supabase
          .from('item_centre_stock')
          .select('current_stock, reorder_level, safety_stock')
          .eq('item_id', item.id)
          .eq('centre_id', centreId)
          .single()
        stockData = data
      }

      // Run forecasting locally
      const { analyzeDemand } = await import('@/lib/forecasting')
      const result = analyzeDemand(
        historical,
        stockData?.current_stock || 0,
        item.lead_time_days || 14,
        7,
        500,
        10
      )
      setForecast(result)
    } catch (err) {
      console.error('Forecasting error:', err)
    } finally {
      setLoading(false)
    }
  }

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(mo) - 1]} ${y.slice(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Item Search */}
      <div className="card p-4">
        <label className="form-label mb-2 block">Search Item for Forecast</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            className="form-input pl-9 w-full max-w-md"
            placeholder="Search by item name or code..."
            value={query}
            onChange={e => searchItems(e.target.value)}
          />
          {searching && <Loader2 size={16} className="absolute right-3 top-3 text-gray-400 animate-spin" />}
          {items.length > 0 && (
            <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-w-md max-h-60 overflow-y-auto">
              {items.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#EEF2F9] border-b border-gray-50 last:border-0"
                  onClick={() => loadForecast(item)}
                >
                  <div className="text-sm font-medium text-[#1B3A6B]">{item.generic_name}</div>
                  <div className="text-xs text-gray-400 flex gap-3">
                    <span className="font-mono">{item.item_code}</span>
                    {item.brand_name && <span>{item.brand_name}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 size={32} className="animate-spin text-[#0D7E8A] mx-auto mb-3" />
          <p className="text-gray-500">Analyzing consumption patterns...</p>
        </div>
      )}

      {/* Forecast Results */}
      {forecast && selectedItem && !loading && (
        <>
          {/* Reorder Analysis Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Avg Monthly Usage</p>
              <p className="text-xl font-bold text-[#1B3A6B]">{forecast.avg_monthly_consumption}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Avg Daily Usage</p>
              <p className="text-xl font-bold text-[#1B3A6B]">{forecast.reorder.avg_daily_usage}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Reorder Point</p>
              <p className="text-xl font-bold text-[#0D7E8A]">{forecast.reorder.reorder_point}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Safety Stock</p>
              <p className="text-xl font-bold text-yellow-600">{forecast.reorder.safety_stock}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">EOQ</p>
              <p className="text-xl font-bold text-green-600">{forecast.reorder.eoq}</p>
            </div>
          </div>

          {forecast.reorder.should_reorder && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <ArrowDown className="text-red-600" size={20} />
              <div>
                <p className="font-semibold text-red-700">Reorder Recommended</p>
                <p className="text-sm text-red-600">
                  {forecast.reorder.days_of_stock !== null
                    ? `${forecast.reorder.days_of_stock} days of stock remaining. `
                    : ''}
                  Consider ordering {forecast.reorder.eoq} units.
                </p>
              </div>
            </div>
          )}

          {/* Historical + Forecast Table */}
          <div className="card overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <h3 className="font-semibold text-[#1B3A6B] flex items-center gap-2">
                <BarChart2 size={18} />
                Consumption History &amp; Forecast — {selectedItem.generic_name}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Quantity</th>
                    <th>Trend</th>
                    <th>Type</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.historical.map((h, i) => {
                    const prev = i > 0 ? forecast.historical[i - 1].qty : h.qty
                    const diff = h.qty - prev
                    return (
                      <tr key={h.month}>
                        <td className="font-medium text-sm">{monthLabel(h.month)}</td>
                        <td className="text-sm font-semibold">{h.qty}</td>
                        <td>
                          {diff > 0 ? <ArrowUp size={14} className="text-green-500" /> :
                           diff < 0 ? <ArrowDown size={14} className="text-red-500" /> :
                           <Minus size={14} className="text-gray-400" />}
                        </td>
                        <td><span className="badge bg-gray-100 text-gray-700">Actual</span></td>
                        <td>—</td>
                      </tr>
                    )
                  })}
                  {forecast.forecast.map(f => (
                    <tr key={f.month} className="bg-blue-50/50">
                      <td className="font-medium text-sm text-[#0D7E8A]">{monthLabel(f.month)}</td>
                      <td className="text-sm font-semibold text-[#0D7E8A]">{f.predicted_qty}</td>
                      <td><TrendingUp size={14} className="text-[#0D7E8A]" /></td>
                      <td><span className="badge bg-blue-100 text-blue-700">Forecast</span></td>
                      <td>
                        <span className={cn('badge',
                          f.confidence === 'high' ? 'bg-green-100 text-green-700' :
                          f.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        )}>
                          {f.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seasonal Pattern */}
          <div className="card p-4">
            <h3 className="font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              Seasonal Pattern
            </h3>
            <div className="flex gap-1 items-end h-24">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                const idx = forecast.seasonal_indices[i]
                const height = Math.max(10, Math.min(100, idx * 50))
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-full rounded-t transition-all',
                        idx > 1.2 ? 'bg-[#0D7E8A]' : idx < 0.8 ? 'bg-red-400' : 'bg-[#1B3A6B]/30'
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-gray-500">{m}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Bars show relative demand intensity. Teal = high demand months, Red = low demand months.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
