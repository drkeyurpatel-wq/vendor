'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn, formatCurrency, formatLakhs } from '@/lib/utils'
import Link from 'next/link'
import {
  RefreshCcw, ShoppingCart, AlertTriangle, CheckCircle2, Loader2,
  Package, ArrowRight, Ban, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Suggestion {
  item_id: string; item_code: string; item_name: string
  centre_id: string; centre_code: string
  current_stock: number; reorder_level: number; max_level: number
  order_qty: number; unit: string
  vendor_id: string | null; vendor_code: string | null; vendor_name: string | null
  rate: number; line_total: number; has_open_po: boolean
}

interface POGroup {
  centre_id: string; centre_code: string
  vendor_id: string; vendor_code: string; vendor_name: string
  items: Suggestion[]; total_amount: number
}

interface ScanResult {
  scan_time: string
  total_items_below_reorder: number
  items_with_open_po: number
  items_without_vendor: number
  actionable_items: number
  suggested_pos: number
  total_value: number
  groups: POGroup[]
  skipped: Suggestion[]
}

export default function AutoReorderPage() {
  const [scanning, setScanning] = useState(false)
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set())
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)
  const [createdPOs, setCreatedPOs] = useState<any[] | null>(null)

  const scan = useCallback(async () => {
    setScanning(true); setCreatedPOs(null)
    try {
      const res = await fetch('/api/reorder/check')
      if (!res.ok) { toast.error('Scan failed'); setScanning(false); return }
      const data = await res.json()
      setResult(data)
      // Auto-select all groups
      setSelectedGroups(new Set(data.groups.map((_: any, i: number) => i)))
      if (data.actionable_items === 0) toast.success('All stock levels healthy!')
      else toast(`${data.actionable_items} items need reorder`, { icon: '⚠️' })
    } catch { toast.error('Network error') }
    setScanning(false)
  }, [])

  useEffect(() => { scan() }, [scan])

  async function generatePOs() {
    if (!result || selectedGroups.size === 0) return
    setCreating(true)
    try {
      const res = await fetch('/api/reorder/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: Array.from(selectedGroups) }),
      })
      const data = await res.json()
      if (data.created > 0) {
        toast.success(`${data.created} draft POs created — ${formatLakhs(data.total_value)}`)
        setCreatedPOs(data.pos)
        // Re-scan to refresh
        setTimeout(scan, 1000)
      } else {
        toast.error(data.error || 'No POs created')
      }
    } catch { toast.error('Failed to create POs') }
    setCreating(false)
  }

  function toggleGroup(idx: number) {
    setSelectedGroups(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const selectedValue = result?.groups.filter((_, i) => selectedGroups.has(i)).reduce((s, g) => s + g.total_amount, 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Auto-Reorder</h1>
          <p className="text-sm text-gray-500 mt-1">Scan stock levels → generate draft POs for items below reorder point</p>
        </div>
        <div className="flex gap-2">
          <button onClick={scan} disabled={scanning} className="btn-secondary text-sm">
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} {scanning ? 'Scanning...' : 'Re-scan'}
          </button>
          {result && result.groups.length > 0 && (
            <button onClick={generatePOs} disabled={creating || selectedGroups.size === 0}
              className="btn-primary text-sm disabled:opacity-50">
              {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> :
                <><ShoppingCart size={14} /> Generate {selectedGroups.size} PO{selectedGroups.size > 1 ? 's' : ''} — {formatLakhs(selectedValue)}</>}
            </button>
          )}
        </div>
      </div>

      {/* Created POs confirmation */}
      {createdPOs && createdPOs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={20} className="text-green-600" />
            <span className="font-semibold text-green-800">{createdPOs.length} Draft POs Created</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {createdPOs.map((po: any) => (
              <Link key={po.po_number} href="/purchase-orders"
                className="bg-white rounded-lg border border-green-200 p-3 hover:shadow-md transition-shadow">
                <div className="font-mono text-sm font-semibold text-teal-600">{po.po_number}</div>
                <div className="text-xs text-gray-600">{po.vendor} · {po.centre}</div>
                <div className="text-sm font-bold text-navy-600 mt-1">{formatLakhs(po.total)} · {po.items} items</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
            <div className="text-xs text-gray-500">Below Reorder</div>
            <div className={cn('text-xl font-bold', result.total_items_below_reorder > 0 ? 'text-red-600' : 'text-green-600')}>
              {result.total_items_below_reorder}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
            <div className="text-xs text-gray-500">Already Ordered</div>
            <div className="text-xl font-bold text-blue-600">{result.items_with_open_po}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
            <div className="text-xs text-gray-500">No Vendor</div>
            <div className="text-xl font-bold text-orange-600">{result.items_without_vendor}</div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 shadow-card p-4">
            <div className="text-xs text-amber-600">Actionable</div>
            <div className="text-xl font-bold text-amber-700">{result.actionable_items}</div>
          </div>
          <div className="bg-white rounded-xl border border-teal-200 shadow-card p-4">
            <div className="text-xs text-teal-600">Suggested POs</div>
            <div className="text-xl font-bold text-teal-700">{result.suggested_pos}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatLakhs(result.total_value)}</div>
          </div>
        </div>
      )}

      {/* PO Groups */}
      {result && result.groups.length > 0 && (
        <div className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-3 px-1">
            <input type="checkbox" checked={selectedGroups.size === result.groups.length}
              onChange={() => setSelectedGroups(selectedGroups.size === result.groups.length ? new Set() : new Set(result.groups.map((_, i) => i)))}
              className="w-4 h-4 rounded border-gray-300 text-teal-600" />
            <span className="text-sm text-gray-600">Select all ({result.groups.length} POs)</span>
          </div>

          {result.groups.map((group, idx) => (
            <div key={idx} className={cn('card overflow-hidden transition-all', selectedGroups.has(idx) ? 'ring-2 ring-teal-500/30' : '')}>
              <div className="px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpandedGroup(expandedGroup === idx ? null : idx)}>
                <input type="checkbox" checked={selectedGroups.has(idx)}
                  onChange={() => toggleGroup(idx)} onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-blue-50 text-blue-700">{group.centre_code}</span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span className="text-sm font-semibold text-gray-900">{group.vendor_name}</span>
                    <span className="font-mono text-xs text-gray-400">{group.vendor_code}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-navy-600">{formatLakhs(group.total_amount)}</div>
                  <div className="text-xs text-gray-500">{group.items.length} items</div>
                </div>
                {expandedGroup === idx ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>

              {expandedGroup === idx && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="data-table">
                    <thead><tr>
                      <th>Item</th><th>Current</th><th>Reorder</th><th>Max</th><th>Order Qty</th><th>Unit</th><th className="text-right">Rate</th><th className="text-right">Amount</th>
                    </tr></thead>
                    <tbody>
                      {group.items.map(item => {
                        const pct = item.reorder_level > 0 ? (item.current_stock / item.reorder_level * 100) : 0
                        return (
                          <tr key={item.item_id}>
                            <td>
                              <Link href={`/items/${item.item_id}`} className="text-sm font-medium text-teal-600 hover:underline">{item.item_code}</Link>
                              <div className="text-xs text-gray-500 truncate max-w-[180px]">{item.item_name}</div>
                            </td>
                            <td>
                              <span className={cn('text-sm font-semibold', item.current_stock <= 0 ? 'text-red-600' : 'text-orange-600')}>
                                {item.current_stock}
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div className={cn('h-full rounded-full', pct < 30 ? 'bg-red-500' : pct < 70 ? 'bg-yellow-500' : 'bg-green-500')}
                                  style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                            </td>
                            <td className="text-sm text-gray-600">{item.reorder_level}</td>
                            <td className="text-sm text-gray-600">{item.max_level}</td>
                            <td className="text-sm font-bold text-navy-600">{item.order_qty}</td>
                            <td className="text-xs text-gray-500">{item.unit}</td>
                            <td className="text-sm text-right font-mono">{formatCurrency(item.rate)}</td>
                            <td className="text-sm text-right font-semibold">{formatCurrency(item.line_total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Skipped items */}
      {result && result.skipped && result.skipped.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Skipped Items ({result.skipped.length})
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Item</th><th>Centre</th><th>Stock</th><th>Reorder</th><th>Reason</th></tr></thead>
                <tbody>
                  {result.skipped.slice(0, 50).map((item, i) => (
                    <tr key={i}>
                      <td>
                        <span className="font-mono text-xs text-gray-600">{item.item_code}</span>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{item.item_name}</div>
                      </td>
                      <td><span className="badge bg-blue-50 text-blue-700">{item.centre_code}</span></td>
                      <td className="text-sm font-medium text-red-600">{item.current_stock}</td>
                      <td className="text-sm text-gray-600">{item.reorder_level}</td>
                      <td>
                        {item.has_open_po ? (
                          <span className="badge bg-blue-100 text-blue-700">Open PO exists</span>
                        ) : (
                          <span className="badge bg-orange-100 text-orange-700">No L1 vendor mapped</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {result && result.total_items_below_reorder === 0 && (
        <div className="card p-12 text-center mt-4">
          <CheckCircle2 size={48} className="mx-auto mb-3 text-green-400" />
          <p className="text-lg font-semibold text-gray-700">All stock levels are healthy</p>
          <p className="text-sm text-gray-400 mt-1">No items below reorder point across any centre</p>
        </div>
      )}

      {!result && !scanning && (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Click Scan to check stock levels</p>
        </div>
      )}
    </div>
  )
}
