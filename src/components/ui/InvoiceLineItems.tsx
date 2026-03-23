'use client'

import { useState, useEffect } from 'react'
import { Trash2, Plus, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import ItemSearch from './ItemSearch'

export interface InvoiceLineItem {
  id?: string
  item_id: string
  item_code: string
  generic_name: string
  po_item_id: string | null
  grn_item_id: string | null
  description: string
  hsn_code: string
  quantity: number
  rate: number
  taxable_amount: number
  cgst_percent: number
  cgst_amount: number
  sgst_percent: number
  sgst_amount: number
  igst_percent: number
  igst_amount: number
  total_amount: number
}

interface Props {
  items: InvoiceLineItem[]
  onChange: (items: InvoiceLineItem[]) => void
  supplyType?: 'intra_state' | 'inter_state'
  grnId?: string
}

function calcLine(item: InvoiceLineItem, supplyType: string): InvoiceLineItem {
  const taxable = Math.round(item.quantity * item.rate * 100) / 100
  const gstPercent = item.cgst_percent + item.sgst_percent + item.igst_percent ||
    (supplyType === 'inter_state' ? item.igst_percent : item.cgst_percent * 2)

  let cgst = 0, sgst = 0, igst = 0
  if (supplyType === 'inter_state') {
    igst = Math.round(taxable * (item.igst_percent || gstPercent) / 100 * 100) / 100
  } else {
    const halfRate = (item.cgst_percent || gstPercent / 2)
    cgst = Math.round(taxable * halfRate / 100 * 100) / 100
    sgst = Math.round(taxable * halfRate / 100 * 100) / 100
  }

  return {
    ...item,
    taxable_amount: taxable,
    cgst_amount: cgst,
    sgst_amount: sgst,
    igst_amount: igst,
    total_amount: Math.round((taxable + cgst + sgst + igst) * 100) / 100,
  }
}

function emptyLine(): InvoiceLineItem {
  return {
    item_id: '',
    item_code: '',
    generic_name: '',
    po_item_id: null,
    grn_item_id: null,
    description: '',
    hsn_code: '',
    quantity: 0,
    rate: 0,
    taxable_amount: 0,
    cgst_percent: 0,
    cgst_amount: 0,
    sgst_percent: 0,
    sgst_amount: 0,
    igst_percent: 0,
    igst_amount: 0,
    total_amount: 0,
  }
}

export default function InvoiceLineItems({ items, onChange, supplyType = 'intra_state', grnId }: Props) {
  const supabase = createClient()
  const [grnLoaded, setGrnLoaded] = useState(false)

  // Auto-populate from GRN items when GRN is selected
  useEffect(() => {
    if (!grnId || grnLoaded) return

    async function loadGRNItems() {
      const { data: grnItems } = await supabase
        .from('grn_items')
        .select('id, item_id, received_qty, rate, gst_percent, po_item_id, item:items(item_code, generic_name, hsn_code)')
        .eq('grn_id', grnId)

      if (grnItems && grnItems.length > 0) {
        const lineItems: InvoiceLineItem[] = grnItems.map((gi: any) => {
          const gstPct = gi.gst_percent || 0
          const item: InvoiceLineItem = {
            item_id: gi.item_id,
            item_code: gi.item?.item_code || '',
            generic_name: gi.item?.generic_name || '',
            po_item_id: gi.po_item_id || null,
            grn_item_id: gi.id,
            description: gi.item?.generic_name || '',
            hsn_code: gi.item?.hsn_code || '',
            quantity: gi.received_qty || 0,
            rate: gi.rate || 0,
            taxable_amount: 0,
            cgst_percent: supplyType === 'intra_state' ? gstPct / 2 : 0,
            cgst_amount: 0,
            sgst_percent: supplyType === 'intra_state' ? gstPct / 2 : 0,
            sgst_amount: 0,
            igst_percent: supplyType === 'inter_state' ? gstPct : 0,
            igst_amount: 0,
            total_amount: 0,
          }
          return calcLine(item, supplyType)
        })
        onChange(lineItems)
        setGrnLoaded(true)
      }
    }

    loadGRNItems()
  }, [grnId])

  // Reset when GRN changes
  useEffect(() => {
    setGrnLoaded(false)
  }, [grnId])

  function addItem(selected: {
    id: string; item_code: string; generic_name: string; unit: string; gst_percent: number;
    hsn_code?: string; manufacturer?: string
  }) {
    const gstPct = selected.gst_percent || 0
    const newItem = calcLine({
      ...emptyLine(),
      item_id: selected.id,
      item_code: selected.item_code,
      generic_name: selected.generic_name,
      description: selected.generic_name,
      hsn_code: selected.hsn_code || '',
      quantity: 1,
      rate: 0,
      cgst_percent: supplyType === 'intra_state' ? gstPct / 2 : 0,
      sgst_percent: supplyType === 'intra_state' ? gstPct / 2 : 0,
      igst_percent: supplyType === 'inter_state' ? gstPct : 0,
    }, supplyType)
    onChange([...items, newItem])
  }

  function updateItem(idx: number, field: keyof InvoiceLineItem, value: number | string) {
    const updated = [...items]
    updated[idx] = calcLine({ ...updated[idx], [field]: value }, supplyType)
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

  const totalTaxable = items.reduce((s, i) => s + i.taxable_amount, 0)
  const totalCGST = items.reduce((s, i) => s + i.cgst_amount, 0)
  const totalSGST = items.reduce((s, i) => s + i.sgst_amount, 0)
  const totalIGST = items.reduce((s, i) => s + i.igst_amount, 0)
  const grandTotal = items.reduce((s, i) => s + i.total_amount, 0)
  const excludeIds = items.map(i => i.item_id).filter(Boolean)

  // Group by HSN for tax summary
  const hsnMap = new Map<string, { hsn: string; taxable: number; cgst: number; sgst: number; igst: number; total: number; count: number }>()
  items.forEach(item => {
    const hsn = item.hsn_code || 'N/A'
    if (!hsnMap.has(hsn)) hsnMap.set(hsn, { hsn, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 })
    const g = hsnMap.get(hsn)!
    g.taxable += item.taxable_amount
    g.cgst += item.cgst_amount
    g.sgst += item.sgst_amount
    g.igst += item.igst_amount
    g.total += item.total_amount
    g.count++
  })

  return (
    <div>
      <div className="mb-4">
        <ItemSearch onSelect={addItem} excludeIds={excludeIds} placeholder="Add invoice line item — search by name or code..." />
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th className="text-right">Taxable</th>
                {supplyType === 'intra_state' ? (
                  <>
                    <th>CGST%</th>
                    <th className="text-right">CGST</th>
                    <th>SGST%</th>
                    <th className="text-right">SGST</th>
                  </>
                ) : (
                  <>
                    <th>IGST%</th>
                    <th className="text-right">IGST</th>
                  </>
                )}
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{item.generic_name || item.description}</div>
                    <div className="font-mono text-xs text-gray-400">{item.item_code}</div>
                    {item.grn_item_id && (
                      <span className="text-[10px] text-[#0D7E8A] font-medium">From GRN</span>
                    )}
                  </td>
                  <td>
                    <input type="text" className="form-input w-24 text-xs font-mono"
                      value={item.hsn_code} onChange={e => updateItem(idx, 'hsn_code', e.target.value)} placeholder="HSN" />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.001" className="form-input w-20 text-center text-sm"
                      value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01" className="form-input w-24 text-right text-sm"
                      value={item.rate || ''} onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)} />
                  </td>
                  <td className="text-sm text-right font-mono">{formatCurrency(item.taxable_amount)}</td>
                  {supplyType === 'intra_state' ? (
                    <>
                      <td>
                        <input type="number" min="0" max="50" step="0.5" className="form-input w-16 text-center text-sm"
                          value={item.cgst_percent || ''} onChange={e => {
                            const val = parseFloat(e.target.value) || 0
                            const updated = [...items]
                            updated[idx] = calcLine({ ...updated[idx], cgst_percent: val, sgst_percent: val }, supplyType)
                            onChange(updated)
                          }} />
                      </td>
                      <td className="text-xs text-gray-500 text-right font-mono">{formatCurrency(item.cgst_amount)}</td>
                      <td>
                        <input type="number" min="0" max="50" step="0.5" className="form-input w-16 text-center text-sm"
                          value={item.sgst_percent || ''} onChange={e => {
                            const val = parseFloat(e.target.value) || 0
                            const updated = [...items]
                            updated[idx] = calcLine({ ...updated[idx], sgst_percent: val, cgst_percent: val }, supplyType)
                            onChange(updated)
                          }} />
                      </td>
                      <td className="text-xs text-gray-500 text-right font-mono">{formatCurrency(item.sgst_amount)}</td>
                    </>
                  ) : (
                    <>
                      <td>
                        <input type="number" min="0" max="100" step="0.5" className="form-input w-16 text-center text-sm"
                          value={item.igst_percent || ''} onChange={e => updateItem(idx, 'igst_percent', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="text-xs text-gray-500 text-right font-mono">{formatCurrency(item.igst_amount)}</td>
                    </>
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
      )}

      {items.length > 0 && (
        <>
          {/* HSN-wise Tax Summary */}
          {hsnMap.size > 0 && (
            <div className="mt-4 p-4 bg-[#EEF2F9] rounded-lg">
              <h4 className="text-xs font-semibold text-[#1B3A6B] uppercase tracking-wide mb-2">HSN-wise Tax Summary</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-300">
                    <th className="text-left py-1">HSN Code</th>
                    <th className="text-right py-1">Taxable</th>
                    {supplyType === 'intra_state' ? (
                      <>
                        <th className="text-right py-1">CGST</th>
                        <th className="text-right py-1">SGST</th>
                      </>
                    ) : (
                      <th className="text-right py-1">IGST</th>
                    )}
                    <th className="text-right py-1">Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(hsnMap.values()).map(row => (
                    <tr key={row.hsn} className="border-b border-gray-200">
                      <td className="py-1 font-mono font-medium">{row.hsn}</td>
                      <td className="py-1 text-right font-mono">{formatCurrency(row.taxable)}</td>
                      {supplyType === 'intra_state' ? (
                        <>
                          <td className="py-1 text-right font-mono">{formatCurrency(row.cgst)}</td>
                          <td className="py-1 text-right font-mono">{formatCurrency(row.sgst)}</td>
                        </>
                      ) : (
                        <td className="py-1 text-right font-mono">{formatCurrency(row.igst)}</td>
                      )}
                      <td className="py-1 text-right font-mono font-semibold">{formatCurrency(row.cgst + row.sgst + row.igst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Taxable Amount:</span><span className="font-medium font-mono">{formatCurrency(totalTaxable)}</span></div>
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
        </>
      )}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          {grnId ? 'Loading GRN items...' : 'Search and add items above, or select a GRN to auto-populate'}
        </div>
      )}
    </div>
  )
}
