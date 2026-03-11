'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import ItemSearch from './ItemSearch'

export interface LineItem {
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  ordered_qty: number
  rate: number
  gst_percent: number
  gst_amount: number
  total_amount: number
  contract_rate?: number | null
  rate_warning?: string | null
}

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  vendorId?: string
}

const RATE_TOLERANCE = 0.005 // ±0.5%

function calcLine(item: LineItem): LineItem {
  const subtotal = item.ordered_qty * item.rate
  const gst_amount = Math.round(subtotal * item.gst_percent / 100)
  const total_amount = subtotal + gst_amount

  // Check rate contract tolerance
  let rate_warning: string | null = null
  if (item.contract_rate && item.rate > 0) {
    const deviation = Math.abs(item.rate - item.contract_rate) / item.contract_rate
    if (deviation > RATE_TOLERANCE) {
      const pct = (deviation * 100).toFixed(1)
      rate_warning = `Rate deviates ${pct}% from contract rate ₹${item.contract_rate.toFixed(2)} (tolerance ±0.5%)`
    }
  }

  return { ...item, gst_amount, total_amount, rate_warning }
}

export default function POLineItems({ items, onChange, vendorId }: Props) {
  const excludeIds = items.map(i => i.item_id)
  const supabase = createClient()
  const [contractRates, setContractRates] = useState<Map<string, number>>(new Map())

  // Fetch active rate contract rates for the selected vendor
  const fetchContractRates = useCallback(async () => {
    if (!vendorId) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('rate_contract_items')
      .select('item_id, rate, rate_contract:rate_contracts!inner(vendor_id, status, valid_from, valid_to)')
      .eq('rate_contract.vendor_id', vendorId)
      .eq('rate_contract.status', 'active')
      .lte('rate_contract.valid_from', today)
      .gte('rate_contract.valid_to', today)

    if (data) {
      const rateMap = new Map<string, number>()
      data.forEach((d: any) => {
        if (d.item_id && d.rate) rateMap.set(d.item_id, d.rate)
      })
      setContractRates(rateMap)
    }
  }, [vendorId])

  useEffect(() => { fetchContractRates() }, [fetchContractRates])

  function addItem(selected: { id: string; item_code: string; generic_name: string; unit: string; gst_percent: number }) {
    const contractRate = contractRates.get(selected.id) ?? null
    const newItem = calcLine({
      item_id: selected.id,
      item_code: selected.item_code,
      generic_name: selected.generic_name,
      unit: selected.unit,
      ordered_qty: 1,
      rate: contractRate ?? 0, // Pre-fill with contract rate if available
      gst_percent: selected.gst_percent,
      gst_amount: 0,
      total_amount: 0,
      contract_rate: contractRate,
    })
    onChange([...items, newItem])
  }

  function updateItem(idx: number, field: 'ordered_qty' | 'rate', value: number) {
    const updated = [...items]
    updated[idx] = calcLine({ ...updated[idx], [field]: value })
    onChange(updated)
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((s, i) => s + i.ordered_qty * i.rate, 0)
  const gstTotal = items.reduce((s, i) => s + i.gst_amount, 0)
  const grandTotal = items.reduce((s, i) => s + i.total_amount, 0)
  const hasRateWarnings = items.some(i => i.rate_warning)

  return (
    <div>
      <div className="mb-4">
        <ItemSearch onSelect={addItem} excludeIds={excludeIds} placeholder="Add item — search by name or code..." />
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Rate (Rs)</th>
                <th>GST %</th>
                <th>GST Amt</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.item_id} className={item.rate_warning ? 'bg-red-50/50' : ''}>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{item.generic_name}</div>
                    <div className="font-mono text-xs text-gray-400">{item.item_code}</div>
                    {item.contract_rate && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={10} className="text-green-500" />
                        <span className="text-[11px] text-green-600">Contract: ₹{item.contract_rate.toFixed(2)}</span>
                      </div>
                    )}
                  </td>
                  <td className="text-sm text-gray-600">{item.unit}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="form-input w-20 text-center"
                      value={item.ordered_qty}
                      onChange={e => updateItem(idx, 'ordered_qty', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-input w-28 text-right ${item.rate_warning ? 'border-red-400 bg-red-50' : ''}`}
                      value={item.rate || ''}
                      onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                    />
                    {item.rate_warning && (
                      <div className="flex items-start gap-1 mt-1">
                        <AlertTriangle size={10} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] text-red-600 leading-tight">{item.rate_warning}</span>
                      </div>
                    )}
                  </td>
                  <td className="text-sm text-gray-600 text-center">{item.gst_percent}%</td>
                  <td className="text-sm text-gray-600 text-right">{formatCurrency(item.gst_amount)}</td>
                  <td className="text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total_amount)}</td>
                  <td>
                    <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasRateWarnings && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <span className="font-semibold">Rate contract violation:</span> One or more items have rates that deviate more than ±0.5% from their active contract rate. This PO will require higher-level approval override.
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST:</span><span className="font-medium">{formatCurrency(gstTotal)}</span></div>
            <div className="flex justify-between border-t pt-2 border-gray-200"><span className="font-semibold text-gray-900">Grand Total:</span><span className="font-bold text-[#1B3A6B] text-base">{formatCurrency(grandTotal)}</span></div>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Search and add items above to build your order
        </div>
      )}
    </div>
  )
}
