'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Search, Loader2, TrendingUp, BarChart2, Package, Calendar,
  Target, ArrowRight, ShieldCheck, ShoppingCart
} from 'lucide-react'
import toast from 'react-hot-toast'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'

interface ForecastData {
  item: {
    id: string
    item_code: string
    generic_name: string
    brand_name: string | null
    lead_time_days: number
    default_rate: number | null
  }
  current_stock: number
  stock_by_centre: Array<{
    centre_id: string
    current_stock: number
    reorder_level: number
    safety_stock: number
    avg_daily_consumption: number | null
    last_grn_date: string | null
    last_grn_rate: number | null
  }>
  historical: Array<{ month: string; qty: number }>
  forecast: Array<{
    month: string
    predicted_qty: number
    confidence: 'high' | 'medium' | 'low'
    method: string
  }>
  reorder: {
    reorder_point: number
    safety_stock: number
    eoq: number
    avg_daily_usage: number
    days_of_stock: number | null
    should_reorder: boolean
  }
  seasonal_indices: number[]
  avg_monthly_consumption: number
}

interface SearchResult {
  id: string
  item_code: string
  generic_name: string
  brand_name: string | null
}

export default function ForecastingClient({ centreId }: { centreId: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ForecastData | null>(null)
  const supabase = createClient()

  const searchItems = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([])
        return
      }
      setSearching(true)
      const { data: items } = await supabase
        .from('items')
        .select('id, item_code, generic_name, brand_name')
        .is('deleted_at', null)
        .eq('is_active', true)
        .or(`generic_name.ilike.%${query}%,item_code.ilike.%${query}%,brand_name.ilike.%${query}%`)
        .limit(10)

      setSearchResults(items || [])
      setSearching(false)
    },
    [supabase]
  )

  const loadForecast = async (itemId: string) => {
    setLoading(true)
    setSearchResults([])
    try {
      const url = `/api/forecasting?item_id=${itemId}${centreId ? `&centre_id=${centreId}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to load forecast data')
      }
      const result = await res.json()
      setData(result)
      setSearchQuery(result.item.generic_name)
    } catch (err) {
      toast.error('Failed to load forecast data')
    } finally {
      setLoading(false)
    }
  }

  const confidenceColor = (c: string) => {
    switch (c) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const monthLabel = (m: string) => {
    const [year, month] = m.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  return (
    <div>
      {/* Item Search */}
      <div className="card p-4 mb-6">
        <label className="form-label flex items-center gap-2 mb-2">
          <Search size={14} />
          Search Item for Forecast
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchItems(e.target.value)
                }}
                placeholder="Type item name, code, or brand..."
                className="form-input"
              />
              {searching && (
                <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
              )}
            </div>
            <BarcodeScanButton onScan={async (code) => {
              const supabase = createClient()
              const { data } = await supabase.from('items').select('id, item_code, generic_name').eq('is_active', true).or(`item_code.eq.${code},item_code.ilike.${code}`).limit(1)
              if (data?.[0]) { loadForecast(data[0].id); setSearchQuery(data[0].generic_name); toast.success(`Loading forecast: ${data[0].generic_name}`) }
              else { setSearchQuery(code); searchItems(code); toast.error(`No match — searching "${code}"`) }
            }} label="Scan" scanType="item" />
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  onClick={() => loadForecast(item.id)}
                  className="w-full text-left px-4 py-3 hover:bg-[#EEF2F9] transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.item_code}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.generic_name}</div>
                      {item.brand_name && (
                        <div className="text-xs text-gray-400">{item.brand_name}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-12 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#0D7E8A]" />
          <span className="ml-3 text-gray-500">Analyzing consumption patterns...</span>
        </div>
      )}

      {/* Forecast Results */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Item Header */}
          <div className="card p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm bg-gray-100 px-2.5 py-1 rounded font-semibold">
                    {data.item.item_code}
                  </span>
                  <h2 className="text-lg font-semibold text-[#1B3A6B]">{data.item.generic_name}</h2>
                </div>
                {data.item.brand_name && (
                  <p className="text-sm text-gray-500">{data.item.brand_name}</p>
                )}
              </div>
              {data.reorder.should_reorder && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <Target size={16} className="text-red-600" />
                  <span className="text-sm font-medium text-red-700">Reorder Recommended</span>
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Current Stock</p>
              <p className="text-xl font-bold text-[#1B3A6B]">{data.current_stock}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Avg Monthly Use</p>
              <p className="text-xl font-bold text-[#1B3A6B]">{data.avg_monthly_consumption}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Avg Daily Use</p>
              <p className="text-xl font-bold text-[#1B3A6B]">{data.reorder.avg_daily_usage}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Days of Stock</p>
              <p className={cn(
                'text-xl font-bold',
                data.reorder.days_of_stock !== null && data.reorder.days_of_stock <= 7 ? 'text-red-600' :
                data.reorder.days_of_stock !== null && data.reorder.days_of_stock <= 14 ? 'text-yellow-600' : 'text-green-600'
              )}>
                {data.reorder.days_of_stock !== null ? `${data.reorder.days_of_stock}d` : 'N/A'}
              </p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">Reorder Point</p>
              <p className="text-xl font-bold text-[#0D7E8A]">{data.reorder.reorder_point}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">EOQ</p>
              <p className="text-xl font-bold text-[#0D7E8A]">{data.reorder.eoq}</p>
            </div>
          </div>

          {/* Safety & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#E6F5F6] flex items-center justify-center">
                <ShieldCheck size={20} className="text-[#0D7E8A]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Safety Stock</p>
                <p className="text-lg font-semibold text-[#1B3A6B]">{data.reorder.safety_stock} units</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EEF2F9] flex items-center justify-center">
                <Calendar size={20} className="text-[#1B3A6B]" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lead Time</p>
                <p className="text-lg font-semibold text-[#1B3A6B]">{data.item.lead_time_days} days</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BarChart2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Forecast Method</p>
                <p className="text-lg font-semibold text-[#1B3A6B] capitalize">
                  {data.forecast[0]?.method?.replace(/_/g, ' ') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Historical Consumption & Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-[#EEF2F9]">
                <h3 className="text-sm font-semibold text-[#1B3A6B] flex items-center gap-2">
                  <BarChart2 size={16} />
                  Historical Consumption (Last 12 Months)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Quantity</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.historical.map((h, i) => {
                      const prevQty = i > 0 ? data.historical[i - 1].qty : h.qty
                      const change = h.qty - prevQty
                      return (
                        <tr key={h.month}>
                          <td className="text-sm font-medium text-gray-700">{monthLabel(h.month)}</td>
                          <td className="text-sm font-semibold text-[#1B3A6B]">{h.qty}</td>
                          <td className="text-sm">
                            {i > 0 && (
                              <span className={cn(
                                'font-medium',
                                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'
                              )}>
                                {change > 0 ? '+' : ''}{change}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Simple bar visualization */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-end gap-1 h-16">
                  {data.historical.map((h) => {
                    const maxQty = Math.max(...data.historical.map(x => x.qty), 1)
                    const height = (h.qty / maxQty) * 100
                    return (
                      <div
                        key={h.month}
                        className="flex-1 bg-[#0D7E8A] rounded-t-sm min-h-[2px] transition-all hover:bg-[#1B3A6B]"
                        style={{ height: `${height}%` }}
                        title={`${monthLabel(h.month)}: ${h.qty}`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-[#E6F5F6]">
                <h3 className="text-sm font-semibold text-[#0D7E8A] flex items-center gap-2">
                  <TrendingUp size={16} />
                  Forecast (Next 3 Months)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Predicted Qty</th>
                      <th>Confidence</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.forecast.map(f => (
                      <tr key={f.month}>
                        <td className="text-sm font-medium text-gray-700">{monthLabel(f.month)}</td>
                        <td className="text-sm font-bold text-[#1B3A6B]">{f.predicted_qty}</td>
                        <td>
                          <span className={cn('badge', confidenceColor(f.confidence))}>
                            {f.confidence}
                          </span>
                        </td>
                        <td className="text-xs text-gray-500 capitalize">{f.method.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seasonal Indices */}
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Seasonal Pattern (12-month index)</p>
                <div className="flex items-end gap-1 h-12">
                  {data.seasonal_indices.map((idx, i) => {
                    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
                    const maxIdx = Math.max(...data.seasonal_indices, 1)
                    const height = (idx / maxIdx) * 100
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className={cn(
                            'w-full rounded-t-sm min-h-[2px] transition-all',
                            idx >= 1.0 ? 'bg-[#0D7E8A]' : 'bg-gray-300'
                          )}
                          style={{ height: `${height}%` }}
                          title={`${months[i]}: ${idx.toFixed(2)}`}
                        />
                        <span className="text-[9px] text-gray-400">{months[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Auto Generate Indent */}
          {data.reorder.should_reorder && (
            <div className="card p-5 bg-red-50 border-red-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Target size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Stock Below Reorder Point</p>
                    <p className="text-sm text-red-600">
                      Current stock ({data.current_stock}) is below reorder point ({data.reorder.reorder_point}).
                      Recommended order quantity: <strong>{data.reorder.eoq} units</strong> (EOQ).
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/purchase-orders/new?item=${data.item.id}${centreId ? `&centre_id=${centreId}` : ''}`}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap text-sm"
                  >
                    <ShoppingCart size={14} />
                    Create PO
                  </a>
                  <a
                    href={`/purchase-orders/indents?auto_item=${data.item.id}${centreId ? `&centre_id=${centreId}` : ''}`}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap text-sm"
                  >
                    <Package size={16} />
                    Create Indent
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state when no item selected */}
      {!data && !loading && (
        <div className="card p-12 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">Select an item above to view demand forecast</p>
          <p className="text-sm text-gray-400 mt-1">
            Search by item name, code, or brand to analyze consumption patterns
          </p>
        </div>
      )}
    </div>
  )
}
