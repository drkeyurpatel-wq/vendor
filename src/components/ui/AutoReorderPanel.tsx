'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, ShoppingCart, AlertTriangle, CheckCircle2, Loader2, Package, ChevronDown } from 'lucide-react'
import { formatCurrency, formatLakhs } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Draft {
  vendor_code: string
  vendor_name: string
  centre_code: string
  items: { item_code: string; generic_name: string; reorder_qty: number; l1_rate: number | null; current_stock: number; reorder_level: number; unit: string }[]
  estimated_total: number
}

interface CheckResult {
  summary: { items_below_reorder: number; items_with_l1_vendor: number; items_without_vendor: number; draft_pos: number; estimated_total: number }
  drafts: Draft[]
  unmapped_items: { item_code: string; generic_name: string; centre: string }[]
}

interface GenerateResult {
  created: number
  pos: { po_number: string; vendor: string; centre: string; items: number; total: number }[]
}

export default function AutoReorderPanel() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [generated, setGenerated] = useState<GenerateResult | null>(null)
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null)

  async function runCheck() {
    setChecking(true); setResult(null); setGenerated(null)
    try {
      const res = await fetch('/api/reorder')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
      if (data.summary.items_below_reorder === 0) toast.success('All stock levels OK')
    } catch (err: any) {
      toast.error(err.message || 'Check failed')
    }
    setChecking(false)
  }

  async function runGenerate() {
    if (!confirm(`This will create ${result?.summary.draft_pos} draft POs. Continue?`)) return
    setGenerating(true)
    try {
      const res = await fetch('/api/reorder', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setGenerated(data)
      toast.success(`${data.created} POs created`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Generation failed')
    }
    setGenerating(false)
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-navy-600 flex items-center gap-2">
            <RefreshCw size={16} /> Auto-Reorder Engine
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Scans stock levels → groups by L1 vendor → generates draft POs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runCheck} disabled={checking} className="btn-secondary text-sm">
            {checking ? <><Loader2 size={14} className="animate-spin" /> Scanning...</> : <><Package size={14} /> Check Stock</>}
          </button>
          {result && result.summary.draft_pos > 0 && !generated && (
            <button onClick={runGenerate} disabled={generating} className="btn-primary text-sm">
              {generating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><ShoppingCart size={14} /> Generate {result.summary.draft_pos} POs</>}
            </button>
          )}
        </div>
      </div>

      {/* Check results */}
      {result && (
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="text-xs text-red-600">Below Reorder</div>
              <div className="text-lg font-bold text-red-700">{result.summary.items_below_reorder}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xs text-green-600">With L1 Vendor</div>
              <div className="text-lg font-bold text-green-700">{result.summary.items_with_l1_vendor}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="text-xs text-yellow-600">No Vendor</div>
              <div className="text-lg font-bold text-yellow-700">{result.summary.items_without_vendor}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-600">Draft POs</div>
              <div className="text-lg font-bold text-blue-700">{result.summary.draft_pos}</div>
            </div>
            <div className="bg-navy-50 rounded-lg p-3 border border-navy-200">
              <div className="text-xs text-gray-600">Est. Value</div>
              <div className="text-lg font-bold text-navy-600">{formatLakhs(result.summary.estimated_total)}</div>
            </div>
          </div>

          {/* Draft PO preview */}
          {result.drafts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Draft POs to generate:</h3>
              {result.drafts.map((d, i) => (
                <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedVendor(expandedVendor === `${d.vendor_code}_${d.centre_code}` ? null : `${d.vendor_code}_${d.centre_code}`)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <span className="badge bg-blue-50 text-blue-700">{d.centre_code}</span>
                      <span className="text-sm font-medium text-gray-900">{d.vendor_name}</span>
                      <span className="font-mono text-xs text-gray-500">{d.vendor_code}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{d.items.length} items</span>
                      <span className="text-sm font-semibold">{formatLakhs(d.estimated_total)}</span>
                      <ChevronDown size={14} className={`text-gray-500 transition-transform ${expandedVendor === `${d.vendor_code}_${d.centre_code}` ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {expandedVendor === `${d.vendor_code}_${d.centre_code}` && (
                    <table className="data-table">
                      <thead><tr><th>Item</th><th>Unit</th><th className="text-right">Current</th><th className="text-right">Reorder</th><th className="text-right">Order Qty</th><th className="text-right">Rate</th><th className="text-right">Value</th></tr></thead>
                      <tbody>
                        {d.items.map((item, j) => (
                          <tr key={j}>
                            <td><div className="text-xs font-mono text-gray-500">{item.item_code}</div><div className="text-sm text-gray-900 truncate max-w-[200px]">{item.generic_name}</div></td>
                            <td className="text-xs text-gray-500">{item.unit}</td>
                            <td className="text-sm text-right text-red-600 font-semibold">{item.current_stock}</td>
                            <td className="text-sm text-right text-gray-600">{item.reorder_level}</td>
                            <td className="text-sm text-right font-semibold text-navy-600">{item.reorder_qty}</td>
                            <td className="text-sm text-right font-mono">{item.l1_rate ? formatCurrency(item.l1_rate) : '—'}</td>
                            <td className="text-sm text-right font-semibold">{item.l1_rate ? formatCurrency(item.l1_rate * item.reorder_qty) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Unmapped items warning */}
          {result.unmapped_items.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 mb-1">
                <AlertTriangle size={14} /> {result.unmapped_items.length} items have no L1 vendor — cannot auto-order
              </div>
              <div className="text-xs text-yellow-600 space-y-0.5">
                {result.unmapped_items.slice(0, 10).map((item, i) => (
                  <div key={i}>{item.item_code} — {item.generic_name} ({item.centre})</div>
                ))}
                {result.unmapped_items.length > 10 && <div>... and {result.unmapped_items.length - 10} more</div>}
              </div>
            </div>
          )}

          {result.summary.items_below_reorder === 0 && (
            <div className="flex items-center gap-2 text-green-600 p-4">
              <CheckCircle2 size={18} /> <span className="text-sm font-medium">All stock levels are above reorder thresholds</span>
            </div>
          )}
        </div>
      )}

      {/* Generated POs */}
      {generated && (
        <div className="p-5 bg-green-50 border-t border-green-200">
          <div className="flex items-center gap-2 text-green-700 mb-3">
            <CheckCircle2 size={18} /> <span className="font-semibold">{generated.created} draft POs created</span>
          </div>
          <div className="space-y-1">
            {generated.pos.map((po, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <span className="font-mono text-teal-600 font-semibold">{po.po_number}</span>
                <span className="text-gray-600">{po.vendor} · {po.centre}</span>
                <span className="text-gray-500">{po.items} items</span>
                <span className="font-semibold">{formatLakhs(po.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
