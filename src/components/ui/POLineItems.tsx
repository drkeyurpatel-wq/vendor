'use client'

import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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
}

interface Props {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

function calcLine(item: LineItem): LineItem {
  const subtotal = item.ordered_qty * item.rate
  const gst_amount = Math.round(subtotal * item.gst_percent / 100)
  const total_amount = subtotal + gst_amount
  return { ...item, gst_amount, total_amount }
}

export default function POLineItems({ items, onChange }: Props) {
  const excludeIds = items.map(i => i.item_id)

  function addItem(selected: { id: string; item_code: string; generic_name: string; unit: string; gst_percent: number }) {
    const newItem = calcLine({
      item_id: selected.id,
      item_code: selected.item_code,
      generic_name: selected.generic_name,
      unit: selected.unit,
      ordered_qty: 1,
      rate: 0,
      gst_percent: selected.gst_percent,
      gst_amount: 0,
      total_amount: 0,
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
                <tr key={item.item_id}>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{item.generic_name}</div>
                    <div className="font-mono text-xs text-gray-400">{item.item_code}</div>
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
                      className="form-input w-28 text-right"
                      value={item.rate || ''}
                      onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                    />
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
