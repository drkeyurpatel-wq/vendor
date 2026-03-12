'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatLakhs, cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Package,
  BarChart3, ShieldAlert, Target, ArrowRight, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Activity, Zap
} from 'lucide-react'

interface AnalyticsData {
  consumption_projections: any[]
  ideal_inventory: any[]
  price_history: any[]
  price_anomalies: any[]
  summary: {
    total_items_analyzed: number
    items_at_stockout_risk: number
    items_with_price_anomalies: number
    items_needing_reorder_adjustment: number
    avg_days_of_stock: number
    total_projected_spend_30d: number
  }
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'rising') return <TrendingUp size={14} className="text-red-500" />
  if (trend === 'falling') return <TrendingDown size={14} className="text-green-500" />
  return <Minus size={14} className="text-gray-400" />
}

const RiskBadge = ({ risk }: { risk: string }) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    safe: 'bg-green-100 text-green-800',
  }
  return <span className={cn('badge', colors[risk] || 'bg-gray-100 text-gray-800')}>{risk}</span>
}

// Simple sparkline bar chart using divs
function MiniBarChart({ values, color = '#0D7E8A' }: { values: number[]; color?: string }) {
  if (values.length === 0) return null
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-px h-8">
      {values.slice(-12).map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-t-sm transition-all"
          style={{ height: `${Math.max(2, (v / max) * 100)}%`, backgroundColor: color, opacity: 0.3 + (i / values.length) * 0.7 }}
        />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [centres, setCentres] = useState<any[]>([])
  const [centreId, setCentreId] = useState('')
  const [activeTab, setActiveTab] = useState<'projections' | 'inventory' | 'prices' | 'anomalies'>('projections')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('centres').select('id, code, name').eq('is_active', true).order('code').then(({ data }) => {
      if (data) setCentres(data)
    })
  }, [])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (centreId) params.set('centre_id', centreId)
    const res = await fetch(`/api/analytics?${params}`)
    if (res.ok) {
      const json = await res.json()
      setData(json)
    }
    setLoading(false)
  }, [centreId])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const s = data?.summary

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2">
            <Brain size={24} className="text-[#0D7E8A]" />
            <h1 className="page-title">AI Analytics & Insights</h1>
          </div>
          <p className="page-subtitle">Consumption projections, inventory optimization, and price intelligence</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select className="form-select text-sm" value={centreId} onChange={e => setCentreId(e.target.value)}>
            <option value="">All Centres</option>
            {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
          <button onClick={fetchAnalytics} disabled={loading} className="btn-secondary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-[#0D7E8A] mx-auto mb-3" />
            <p className="text-sm text-gray-500">Analyzing procurement data...</p>
          </div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="stat-card border-l-4 border-[#0D7E8A]">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-[#0D7E8A]" />
                <span className="text-xs text-gray-500">Items Analyzed</span>
              </div>
              <div className="text-2xl font-bold text-[#0D7E8A]">{s?.total_items_analyzed ?? 0}</div>
            </div>
            <div className="stat-card border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-xs text-gray-500">Stockout Risk</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{s?.items_at_stockout_risk ?? 0}</div>
            </div>
            <div className="stat-card border-l-4 border-orange-500">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={16} className="text-orange-500" />
                <span className="text-xs text-gray-500">Price Anomalies</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{s?.items_with_price_anomalies ?? 0}</div>
            </div>
            <div className="stat-card border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-yellow-600" />
                <span className="text-xs text-gray-500">Reorder Adjustments</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700">{s?.items_needing_reorder_adjustment ?? 0}</div>
            </div>
            <div className="stat-card border-l-4 border-[#1B3A6B]">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-[#1B3A6B]" />
                <span className="text-xs text-gray-500">Projected 30d Spend</span>
              </div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{formatLakhs(s?.total_projected_spend_30d ?? 0)}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {[
              { key: 'projections', label: 'Consumption Projections', icon: <TrendingUp size={14} />, count: data.consumption_projections.length },
              { key: 'inventory', label: 'Ideal Inventory', icon: <Package size={14} />, count: data.ideal_inventory.length },
              { key: 'prices', label: 'Historic Prices', icon: <BarChart3 size={14} />, count: data.price_history.length },
              { key: 'anomalies', label: 'Price Anomalies', icon: <ShieldAlert size={14} />, count: data.price_anomalies.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.key
                    ? 'border-[#0D7E8A] text-[#0D7E8A]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.icon} {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    activeTab === tab.key ? 'bg-[#E6F5F6] text-[#0D7E8A]' : 'bg-gray-100 text-gray-500'
                  )}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'projections' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-[#EEF2F9] border-b border-gray-200 flex items-center gap-2">
                <Brain size={16} className="text-[#1B3A6B]" />
                <span className="text-sm font-semibold text-[#1B3A6B]">AI-powered consumption forecasting using Exponential Moving Average</span>
              </div>
              {data.consumption_projections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Centre</th>
                        <th>Avg Daily</th>
                        <th>Trend</th>
                        <th>30d Proj.</th>
                        <th>60d Proj.</th>
                        <th>90d Proj.</th>
                        <th>Days Left</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.consumption_projections.map((cp: any) => (
                        <tr key={`${cp.item_id}-${cp.centre_id}`} className={cp.stockout_risk === 'critical' ? 'bg-red-50/50' : ''}>
                          <td>
                            <div className="font-medium text-gray-900 text-sm">{cp.generic_name}</div>
                            <div className="font-mono text-xs text-gray-400">{cp.item_code}</div>
                          </td>
                          <td><span className="badge bg-blue-50 text-blue-700">{cp.centre_code}</span></td>
                          <td className="text-sm font-semibold">{cp.avg_daily_consumption}</td>
                          <td>
                            <div className="flex items-center gap-1 text-sm">
                              <TrendIcon trend={cp.trend} />
                              <span className={cn(
                                'font-medium',
                                cp.trend === 'rising' ? 'text-red-600' : cp.trend === 'falling' ? 'text-green-600' : 'text-gray-500'
                              )}>
                                {cp.trend_percent > 0 ? '+' : ''}{cp.trend_percent}%
                              </span>
                            </div>
                          </td>
                          <td className="text-sm font-medium">{cp.projected_30d.toLocaleString()}</td>
                          <td className="text-sm text-gray-600">{cp.projected_60d.toLocaleString()}</td>
                          <td className="text-sm text-gray-600">{cp.projected_90d.toLocaleString()}</td>
                          <td>
                            <span className={cn(
                              'text-sm font-bold',
                              cp.days_of_stock_remaining !== null && cp.days_of_stock_remaining <= 7 ? 'text-red-600' :
                              cp.days_of_stock_remaining !== null && cp.days_of_stock_remaining <= 21 ? 'text-yellow-600' : 'text-green-600'
                            )}>
                              {cp.days_of_stock_remaining !== null ? `${cp.days_of_stock_remaining}d` : '—'}
                            </span>
                          </td>
                          <td><RiskBadge risk={cp.stockout_risk} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state py-12">
                  <Activity size={32} className="mb-2" />
                  <p className="text-sm">No consumption data available yet. Import consumption data from eClinicalworks to see projections.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-[#EEF2F9] border-b border-gray-200 flex items-center gap-2">
                <Brain size={16} className="text-[#1B3A6B]" />
                <span className="text-sm font-semibold text-[#1B3A6B]">Optimal inventory levels using Safety Stock + EOQ model (95% service level)</span>
              </div>
              {data.ideal_inventory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Centre</th>
                        <th>Current Stock</th>
                        <th>Current Reorder</th>
                        <th>Recommended</th>
                        <th>Safety Stock</th>
                        <th>EOQ</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ideal_inventory.map((inv: any) => (
                        <tr key={`${inv.item_id}-${inv.centre_id}`}>
                          <td>
                            <div className="font-medium text-gray-900 text-sm">{inv.generic_name}</div>
                            <div className="font-mono text-xs text-gray-400">{inv.item_code}</div>
                          </td>
                          <td><span className="badge bg-blue-50 text-blue-700">{inv.centre_code}</span></td>
                          <td className="text-sm font-semibold">{inv.current_stock}</td>
                          <td className="text-sm text-gray-600">{inv.reorder_level}</td>
                          <td>
                            <span className={cn(
                              'text-sm font-bold',
                              inv.adjustment_needed === 'increase' ? 'text-red-600' :
                              inv.adjustment_needed === 'decrease' ? 'text-blue-600' : 'text-green-600'
                            )}>
                              {inv.recommended_reorder_level}
                            </span>
                          </td>
                          <td className="text-sm text-gray-600">{inv.safety_stock}</td>
                          <td className="text-sm text-gray-600">{inv.economic_order_qty}</td>
                          <td>
                            <span className={cn('badge', {
                              'bg-red-100 text-red-800': inv.adjustment_needed === 'increase',
                              'bg-blue-100 text-blue-800': inv.adjustment_needed === 'decrease',
                              'bg-green-100 text-green-800': inv.adjustment_needed === 'optimal',
                            })}>
                              {inv.adjustment_needed === 'increase' ? 'Increase reorder' :
                               inv.adjustment_needed === 'decrease' ? 'Decrease reorder' : 'Optimal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state py-12">
                  <Package size={32} className="mb-2" />
                  <p className="text-sm">Need consumption data to calculate ideal inventory levels.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-[#EEF2F9] border-b border-gray-200 flex items-center gap-2">
                <Brain size={16} className="text-[#1B3A6B]" />
                <span className="text-sm font-semibold text-[#1B3A6B]">Historic price tracking across all POs with trend analysis</span>
              </div>
              {data.price_history.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {data.price_history.map((ph: any) => {
                    const isExpanded = expandedItem === ph.item_id
                    return (
                      <div key={ph.item_id}>
                        <button
                          onClick={() => setExpandedItem(isExpanded ? null : ph.item_id)}
                          className="w-full flex items-center px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{ph.generic_name}</span>
                              <span className="font-mono text-xs text-gray-400">{ph.item_code}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span>Avg: {formatCurrency(ph.avg_rate)}</span>
                              <span>Min: {formatCurrency(ph.min_rate)}</span>
                              <span>Max: {formatCurrency(ph.max_rate)}</span>
                              <span>Latest: <span className="font-semibold text-gray-700">{formatCurrency(ph.latest_rate)}</span></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <MiniBarChart values={ph.rates.map((r: any) => r.rate)} color={ph.rate_trend === 'rising' ? '#EF4444' : ph.rate_trend === 'falling' ? '#10B981' : '#0D7E8A'} />
                            <div className="flex items-center gap-1">
                              <TrendIcon trend={ph.rate_trend} />
                              <span className={cn(
                                'text-sm font-medium',
                                ph.rate_trend === 'rising' ? 'text-red-600' : ph.rate_trend === 'falling' ? 'text-green-600' : 'text-gray-500'
                              )}>
                                {ph.rate_change_pct > 0 ? '+' : ''}{ph.rate_change_pct}%
                              </span>
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-5 pb-4 bg-gray-50">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 text-xs">
                                  <th className="text-left py-2 font-medium">Date</th>
                                  <th className="text-left py-2 font-medium">PO Number</th>
                                  <th className="text-left py-2 font-medium">Vendor</th>
                                  <th className="text-right py-2 font-medium">Rate</th>
                                  <th className="text-right py-2 font-medium">vs Avg</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {ph.rates.slice(-20).map((r: any, i: number) => {
                                  const diff = ((r.rate - ph.avg_rate) / ph.avg_rate) * 100
                                  return (
                                    <tr key={i}>
                                      <td className="py-1.5 text-gray-600">{r.date}</td>
                                      <td className="py-1.5 font-mono text-gray-600">{r.po_number}</td>
                                      <td className="py-1.5 text-gray-600">{r.vendor_name}</td>
                                      <td className="py-1.5 text-right font-semibold">{formatCurrency(r.rate)}</td>
                                      <td className={cn('py-1.5 text-right font-medium', diff > 5 ? 'text-red-600' : diff < -5 ? 'text-green-600' : 'text-gray-500')}>
                                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state py-12">
                  <BarChart3 size={32} className="mb-2" />
                  <p className="text-sm">No price history available yet. Create purchase orders to see price trends.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'anomalies' && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 bg-[#EEF2F9] border-b border-gray-200 flex items-center gap-2">
                <Brain size={16} className="text-[#1B3A6B]" />
                <span className="text-sm font-semibold text-[#1B3A6B]">Statistical anomaly detection: rates deviating &gt;2 standard deviations from mean</span>
              </div>
              {data.price_anomalies.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>PO</th>
                        <th>Date</th>
                        <th>Vendor</th>
                        <th>Rate</th>
                        <th>Avg Rate</th>
                        <th>Deviation</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.price_anomalies.map((a: any, i: number) => (
                        <tr key={i} className={a.severity === 'high' ? 'bg-red-50/50' : ''}>
                          <td>
                            <div className="font-medium text-gray-900 text-sm">{a.generic_name}</div>
                            <div className="font-mono text-xs text-gray-400">{a.item_code}</div>
                          </td>
                          <td className="text-sm font-mono text-gray-600">{a.po_number}</td>
                          <td className="text-sm text-gray-600">{a.po_date}</td>
                          <td className="text-sm text-gray-600">{a.vendor_name}</td>
                          <td className="text-sm font-bold text-red-700">{formatCurrency(a.rate)}</td>
                          <td className="text-sm text-gray-600">{formatCurrency(a.avg_rate)}</td>
                          <td>
                            <span className="text-sm font-semibold text-red-600">
                              {a.rate > a.avg_rate ? '+' : '-'}{a.deviation_pct}%
                            </span>
                          </td>
                          <td>
                            <span className={cn('badge', a.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>
                              {a.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state py-12">
                  <ShieldAlert size={32} className="mb-2 text-green-400" />
                  <p className="text-sm text-green-600">No price anomalies detected. All rates are within normal range.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
