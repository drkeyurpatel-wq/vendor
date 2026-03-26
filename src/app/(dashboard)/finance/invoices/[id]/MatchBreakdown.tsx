'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface MatchItem {
  item_id: string
  item_code: string
  item_name: string
  po_qty: number
  po_rate: number
  grn_accepted_qty: number
  invoice_qty: number
  invoice_rate: number
}

interface MatchResult {
  item_id: string
  po_qty: number
  po_rate: number
  grn_qty: number
  invoice_qty: number
  invoice_rate: number
  qty_match: boolean
  rate_match: boolean
}

interface MatchBreakdownProps {
  invoice_id: string
  po_id: string | null
  grn_ids: string[]
  initialItems: MatchItem[]
  currentMatchStatus: string
}

export default function MatchBreakdown({
  invoice_id,
  po_id,
  grn_ids,
  initialItems,
  currentMatchStatus,
}: MatchBreakdownProps) {
  const [loading, setLoading] = useState(false)
  const [matchStatus, setMatchStatus] = useState(currentMatchStatus)
  const [items, setItems] = useState<MatchItem[]>(initialItems)
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null)

  const RATE_TOLERANCE = 0.005
  const QTY_TOLERANCE = 0.02

  const computeLocalMatch = (item: MatchItem) => {
    // TRUE 3-way: PO qty vs Invoice qty AND GRN accepted vs Invoice qty
    const poQtyDev = Math.abs(item.po_qty - item.invoice_qty) / Math.max(item.po_qty, 1)
    const grnQtyDev = Math.abs(item.grn_accepted_qty - item.invoice_qty) / Math.max(item.grn_accepted_qty, 1)
    const qtyMatch = poQtyDev <= QTY_TOLERANCE && grnQtyDev <= QTY_TOLERANCE
    const rateDiff = item.po_rate > 0 ? Math.abs(item.po_rate - item.invoice_rate) / item.po_rate : 0
    const rateMatch = rateDiff <= RATE_TOLERANCE
    return { qtyMatch, rateMatch }
  }

  const handleRerunMatch = async () => {
    if (!po_id) {
      toast.error('No PO linked to this invoice -- cannot run 3-way match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/invoices/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to run 3-way match')
        return
      }

      setMatchStatus(data.match_status)
      setMatchResults(data.results)

      if (data.match_status === 'matched') {
        toast.success('All items matched successfully')
      } else if (data.match_status === 'partial_match') {
        toast('Partial match detected -- some items have discrepancies', { icon: '\u26A0\uFE0F' })
      } else {
        const reason = data.reason || 'Mismatch detected -- payment blocked until resolved'
        toast.error(reason, { duration: 6000 })
      }

      // Show warnings if any
      if (data.warnings?.length) {
        data.warnings.forEach((w: string) => toast(w, { icon: '\u26A0\uFE0F', duration: 5000 }))
      }
    } catch {
      toast.error('Network error -- please try again')
    } finally {
      setLoading(false)
    }
  }

  const MATCH_BADGE: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    matched: 'bg-green-100 text-green-800',
    partial_match: 'bg-yellow-100 text-yellow-800',
    mismatch: 'bg-red-100 text-red-800',
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-navy-600">3-Way Match Breakdown</h2>
          <span className={cn('badge', MATCH_BADGE[matchStatus] || MATCH_BADGE.pending)}>
            {matchStatus.replace(/_/g, ' ')}
          </span>
        </div>
        <button
          onClick={handleRerunMatch}
          disabled={loading}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {loading ? 'Running...' : 'Re-run 3-Way Match'}
        </button>
      </div>

      {!po_id ? (
        <div className="p-8 text-center">
          <XCircle size={32} className="mx-auto mb-3 text-red-400" />
          <p className="font-medium text-red-700">No PO linked to this invoice</p>
          <p className="text-sm text-gray-500 mt-1">Payment is blocked per the No PO = No Payment rule</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No line items available for comparison.</p>
          <p className="text-sm text-gray-500 mt-1">Click &ldquo;Re-run 3-Way Match&rdquo; to fetch and compare items from the API.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th className="text-right">PO Qty</th>
                <th className="text-right">PO Rate</th>
                <th className="text-right">GRN Accepted</th>
                <th className="text-right">Invoice Qty</th>
                <th className="text-right">Invoice Rate</th>
                <th className="text-center">Qty Match</th>
                <th className="text-center">Rate Match</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                // Use API results if available, otherwise compute locally
                const apiResult = matchResults?.find(r => r.item_id === item.item_id)
                let qtyMatch: boolean
                let rateMatch: boolean

                if (apiResult) {
                  qtyMatch = apiResult.qty_match
                  rateMatch = apiResult.rate_match
                } else {
                  const local = computeLocalMatch(item)
                  qtyMatch = local.qtyMatch
                  rateMatch = local.rateMatch
                }

                return (
                  <tr key={item.item_id}>
                    <td className="font-mono text-xs text-gray-600">{item.item_code}</td>
                    <td className="text-sm font-medium text-gray-900">{item.item_name}</td>
                    <td className="text-sm text-right font-mono">{item.po_qty}</td>
                    <td className="text-sm text-right font-mono">{formatCurrency(item.po_rate)}</td>
                    <td className="text-sm text-right font-mono">{item.grn_accepted_qty}</td>
                    <td className="text-sm text-right font-mono">{item.invoice_qty}</td>
                    <td className="text-sm text-right font-mono">{formatCurrency(item.invoice_rate)}</td>
                    <td className="text-center">
                      {qtyMatch ? (
                        <CheckCircle2 size={18} className="inline text-green-600" />
                      ) : (
                        <XCircle size={18} className="inline text-red-500" />
                      )}
                    </td>
                    <td className="text-center">
                      {rateMatch ? (
                        <CheckCircle2 size={18} className="inline text-green-600" />
                      ) : (
                        <XCircle size={18} className="inline text-red-500" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {matchResults && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-6 text-sm">
          <span className="text-gray-500">
            Total items: <span className="font-semibold text-gray-900">{matchResults.length}</span>
          </span>
          <span className="text-gray-500">
            Matched: <span className="font-semibold text-green-700">{matchResults.filter(r => r.qty_match && r.rate_match).length}</span>
          </span>
          <span className="text-gray-500">
            Mismatched: <span className="font-semibold text-red-700">{matchResults.filter(r => !r.qty_match || !r.rate_match).length}</span>
          </span>
        </div>
      )}
    </div>
  )
}
