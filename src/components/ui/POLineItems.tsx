'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import ItemSearch from './ItemSearch'

export interface LineItem {
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  hsn_code: string
  manufacturer: string
  // Unit conversion
  purchase_unit: string
  conversion_factor: number
  base_qty: number
  // Quantities
  ordered_qty: number
  free_qty: number
  // Pricing
  rate: number
  mrp: number
  net_rate: number
  // Discounts
  trade_discount_percent: number
  trade_discount_amount: number
  cash_discount_percent: number
  special_discount_percent: number
  // Tax (CGST/SGST/IGST split)
  gst_percent: number
  cgst_percent: number
  sgst_percent: number
  igst_percent: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  gst_amount: number
  total_amount: number
  // Rate contract
  contract_rate?: number | null
  rate_warning?: string | null
  // Delivery
  delivery_date: string
}

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  vendorId?: string
  supplyType?: 'intra_state' | 'inter_state'
}

const RATE_TOLERANCE = 0.005 // ±0.5%

function calcLine(item: LineItem, supplyType: string): LineItem {
  // Apply trade discount
  const tradeDiscAmt = item.rate * item.trade_discount_percent / 100
  const afterTrade = item.rate - tradeDiscAmt

  // Apply cash + special discounts
  const cashDiscAmt = afterTrade * item.cash_discount_percent / 100
  const specialDiscAmt = afterTrade * item.special_discount_percent / 100
  const netRate = afterTrade - cashDiscAmt - specialDiscAmt

  // Taxable value
  const taxableValue = Math.round(item.ordered_qty * netRate * 100) / 100

  // GST split
  let cgst = 0, sgst = 0, igst = 0
  if (supplyType === 'inter_state') {
    igst = Math.round(taxableValue * item.gst_percent / 100 * 100) / 100
  } else {
    cgst = Math.round(taxableValue * item.gst_percent / 200 * 100) / 100
    sgst = Math.round(taxableValue * item.gst_percent / 200 * 100) / 100
  }

  const gstAmount = cgst + sgst + igst
  const totalAmount = Math.round((taxableValue + gstAmount) * 100) / 100

  // Base qty (in issue unit)
  const baseQty = item.ordered_qty * item.conversion_factor

  // Rate contract check
  let rateWarning: string | null = null
  if (item.contract_rate && item.rate > 0) {
    const deviation = Math.abs(item.rate - item.contract_rate) / item.contract_rate
    if (deviation > RATE_TOLERANCE) {
      rateWarning = `Rate deviates ${(deviation * 100).toFixed(1)}% from contract ₹${item.contract_rate.toFixed(2)}`
    }
  }

  return {
    ...item,
    net_rate: Math.round(netRate * 100) / 100,
    trade_discount_amount: Math.round(tradeDiscAmt * item.ordered_qty * 100) / 100,
    base_qty: baseQty,
    cgst_percent: supplyType === 'inter_state' ? 0 : item.gst_percent / 2,
    sgst_percent: supplyType === 'inter_state' ? 0 : item.gst_percent / 2,
    igst_percent: supplyType === 'inter_state' ? item.gst_percent : 0,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    rate_warning: rateWarning,
  }
}

export default function POLineItems({ items, onChange, vendorId, supplyType = 'intra_state' }: Props) {
  const excludeIds = items.map(i => i.item_id)
  const supabase = createClient()
  const [contractRates, setContractRates] = useState<Map<string, number>>(new Map())
  const [showDiscounts, setShowDiscounts] = useState(false)

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

  function addItem(selected: {
    id: string; item_code: string; generic_name: string; unit: string; gst_percent: number;
    hsn_code?: string; manufacturer?: string; purchase_unit?: string; qty_conversion?: number; mrp?: number
  }) {
    const contractRate = contractRates.get(selected.id) ?? null
    const conversionFactor = selected.qty_conversion || 1
    const purchaseUnit = selected.purchase_unit || selected.unit

    const newItem = calcLine({
      item_id: selected.id,
      item_code: selected.item_code,
      generic_name: selected.generic_name,
      unit: selected.unit,
      hsn_code: selected.hsn_code || '',
      manufacturer: selected.manufacturer || '',
      purchase_unit: purchaseUnit,
      conversion_factor: conversionFactor,
      base_qty: conversionFactor,
      ordered_qty: 1,
      free_qty: 0,
      rate: contractRate ?? 0,
      mrp: selected.mrp || 0,
      net_rate: 0,
      trade_discount_percent: 0,
      trade_discount_amount: 0,
      cash_discount_percent: 0,
      special_discount_percent: 0,
      gst_percent: selected.gst_percent,
      cgst_percent: 0,
      sgst_percent: 0,
      igst_percent: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      gst_amount: 0,
      total_amount: 0,
      contract_rate: contractRate,
      rate_warning: null,
      delivery_date: '',
    }, supplyType)
    onChange([...items, newItem])
  }

  function updateItem(idx: number, field: keyof LineItem, value: number | string) {
    const updated = [...items]
    updated[idx] = calcLine({ ...updated[idx], [field]: value } as LineItem, supplyType)
    onChange(updated)
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  // Recalculate all when supply type changes
  useEffect(() => {
    if (items.length > 0) {
      onChange(items.map(item => calcLine(item, supplyType)))
    }
  }, [supplyType])

  const subtotal = items.reduce((s, i) => s + i.ordered_qty * i.net_rate, 0)
  const totalTradeDisc = items.reduce((s, i) => s + i.trade_discount_amount, 0)
  const totalCGST = items.reduce((s, i) => s + i.cgst_amount, 0)
  const totalSGST = items.reduce((s, i) => s + i.sgst_amount, 0)
  const totalIGST = items.reduce((s, i) => s + i.igst_amount, 0)
  const gstTotal = items.reduce((s, i) => s + i.gst_amount, 0)
  const grandTotal = items.reduce((s, i) => s + i.total_amount, 0)
  const hasRateWarnings = items.some(i => i.rate_warning)

  return (
    <div>
      <div className="mb-4">
        <ItemSearch onSelect={addItem} excludeIds={excludeIds} placeholder="Add item — search by name or code..." />
      </div>

      {items.length > 0 && (
        <>
          {/* Toggle discount columns */}
          <button type="button" onClick={() => setShowDiscounts(!showDiscounts)}
            className="text-xs text-[#0D7E8A] hover:underline mb-2 flex items-center gap-1">
            {showDiscounts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDiscounts ? 'Hide' : 'Show'} discount columns
          </button>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>HSN</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Free</th>
                  <th>Rate</th>
                  {showDiscounts && <th>Trade%</th>}
                  {showDiscounts && <th>Cash%</th>}
                  <th>Net Rate</th>
                  {supplyType === 'intra_state' ? (
                    <>
                      <th>CGST</th>
                      <th>SGST</th>
                    </>
                  ) : (
                    <th>IGST</th>
                  )}
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.item_id} className={item.rate_warning ? 'bg-red-50/50' : ''}>
                    <td>
                      <div className="font-medium text-gray-900 text-sm">{item.generic_name}</div>
                      <div className="font-mono text-xs text-gray-400">{item.item_code}</div>
                      {item.manufacturer && <div className="text-[10px] text-gray-400">{item.manufacturer}</div>}
                      {item.contract_rate && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={10} className="text-green-500" />
                          <span className="text-[10px] text-green-600">Contract: ₹{item.contract_rate.toFixed(2)}</span>
                        </div>
                      )}
                    </td>
                    <td className="font-mono text-xs text-gray-500">{item.hsn_code || '—'}</td>
                    <td className="text-xs text-gray-600">
                      {item.purchase_unit !== item.unit ? (
                        <div>
                          <div>{item.purchase_unit}</div>
                          <div className="text-[10px] text-gray-400">×{item.conversion_factor} {item.unit}</div>
                        </div>
                      ) : item.unit}
                    </td>
                    <td>
                      <input type="number" min="1" className="form-input w-16 text-center text-sm"
                        value={item.ordered_qty} onChange={e => updateItem(idx, 'ordered_qty', Math.max(1, parseInt(e.target.value) || 1))} />
                    </td>
                    <td>
                      <input type="number" min="0" className="form-input w-14 text-center text-sm"
                        value={item.free_qty || ''} onChange={e => updateItem(idx, 'free_qty', parseInt(e.target.value) || 0)} />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01"
                        className={`form-input w-24 text-right text-sm ${item.rate_warning ? 'border-red-400 bg-red-50' : ''}`}
                        value={item.rate || ''} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} />
                      {item.rate_warning && (
                        <div className="flex items-start gap-1 mt-1 max-w-[120px]">
                          <AlertTriangle size={10} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-[9px] text-red-600 leading-tight">{item.rate_warning}</span>
                        </div>
                      )}
                    </td>
                    {showDiscounts && (
                      <td>
                        <input type="number" min="0" max="100" step="0.01" className="form-input w-16 text-center text-sm"
                          value={item.trade_discount_percent || ''} onChange={e => updateItem(idx, 'trade_discount_percent', parseFloat(e.target.value) || 0)} />
                      </td>
                    )}
                    {showDiscounts && (
                      <td>
                        <input type="number" min="0" max="100" step="0.01" className="form-input w-16 text-center text-sm"
                          value={item.cash_discount_percent || ''} onChange={e => updateItem(idx, 'cash_discount_percent', parseFloat(e.target.value) || 0)} />
                      </td>
                    )}
                    <td className="text-sm text-gray-600 text-right font-mono">{formatCurrency(item.net_rate)}</td>
                    {supplyType === 'intra_state' ? (
                      <>
                        <td className="text-xs text-gray-500 text-right">
                          <div>{item.cgst_percent}%</div>
                          <div className="font-mono">{formatCurrency(item.cgst_amount)}</div>
                        </td>
                        <td className="text-xs text-gray-500 text-right">
                          <div>{item.sgst_percent}%</div>
                          <div className="font-mono">{formatCurrency(item.sgst_amount)}</div>
                        </td>
                      </>
                    ) : (
                      <td className="text-xs text-gray-500 text-right">
                        <div>{item.igst_percent}%</div>
                        <div className="font-mono">{formatCurrency(item.igst_amount)}</div>
                      </td>
                    )}
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
        </>
      )}

      {hasRateWarnings && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-700">
            <span className="font-semibold">Rate contract violation:</span> Items have rates deviating &gt;±0.5% from contract. Higher-level approval required.
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-medium font-mono">{formatCurrency(subtotal)}</span></div>
            {totalTradeDisc > 0 && (
              <div className="flex justify-between text-green-600"><span>Trade Discount:</span><span className="font-mono">-{formatCurrency(totalTradeDisc)}</span></div>
            )}
            {supplyType === 'intra_state' ? (
              <>
                <div className="flex justify-between"><span className="text-gray-500">CGST:</span><span className="font-medium font-mono">{formatCurrency(totalCGST)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">SGST:</span><span className="font-medium font-mono">{formatCurrency(totalSGST)}</span></div>
              </>
            ) : (
              <div className="flex justify-between"><span className="text-gray-500">IGST:</span><span className="font-medium font-mono">{formatCurrency(totalIGST)}</span></div>
            )}
            <div className="flex justify-between border-t pt-2 border-gray-200">
              <span className="font-semibold text-[#1B3A6B]">Grand Total:</span>
              <span className="font-bold text-[#1B3A6B] text-base font-mono">{formatCurrency(grandTotal)}</span>
            </div>
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
