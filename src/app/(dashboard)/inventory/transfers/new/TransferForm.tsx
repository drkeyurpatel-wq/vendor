'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ArrowLeftRight, Plus, Trash2, Save, Loader2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'

interface Centre {
  id: string
  code: string
  name: string
}

interface StockItem {
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  available_stock: number
}

interface TransferLine {
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  available_stock: number
  transfer_qty: number
}

export default function NewStockTransferForm({ centres, userCentreId }: { centres: Centre[]; userCentreId: string | null }) {
  const supabase = createClient()
  const router = useRouter()

  const [fromCentreId, setFromCentreId] = useState(userCentreId || '')
  const [toCentreId, setToCentreId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [lines, setLines] = useState<TransferLine[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Item search
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<StockItem[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Search items with stock at source centre
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2 || !fromCentreId) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const term = `%${searchTerm.trim()}%`

      const { data } = await supabase
        .from('item_centre_stock')
        .select('item_id, current_stock, item:items(item_code, generic_name, unit)')
        .eq('centre_id', fromCentreId)
        .gt('current_stock', 0)
        .or(`item.generic_name.ilike.${term},item.item_code.ilike.${term}`)
        .limit(10)

      const results: StockItem[] = (data || [])
        .filter((d: any) => d.item)
        .map((d: any) => ({
          item_id: d.item_id,
          item_code: d.item.item_code,
          generic_name: d.item.generic_name,
          unit: d.item.unit,
          available_stock: d.current_stock,
        }))
        .filter(r => !lines.find(l => l.item_id === r.item_id))

      setSearchResults(results)
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, fromCentreId])

  const addLine = (item: StockItem) => {
    setLines(prev => [...prev, { ...item, transfer_qty: 1 }])
    setSearchTerm('')
    setSearchResults([])
    setShowSearch(false)
  }

  const removeLine = (idx: number) => {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  const updateQty = (idx: number, qty: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, transfer_qty: Math.max(0, qty) } : l))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!fromCentreId) e.from = 'Select source centre'
    if (!toCentreId) e.to = 'Select destination centre'
    if (fromCentreId && toCentreId && fromCentreId === toCentreId) e.to = 'Source and destination must differ'
    if (lines.length === 0) e.items = 'Add at least one item'
    lines.forEach((l, i) => {
      if (l.transfer_qty <= 0) e[`qty_${i}`] = 'Qty must be > 0'
      if (l.transfer_qty > l.available_stock) e[`qty_${i}`] = `Max available: ${l.available_stock}`
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (status: 'draft' | 'approved') => {
    if (!validate()) return
    setSaving(true)

    // Generate transfer number
    const { count } = await supabase.from('stock_transfers').select('*', { count: 'exact', head: true })
    const fromCode = centres.find(c => c.id === fromCentreId)?.code || 'XX'
    const toCode = centres.find(c => c.id === toCentreId)?.code || 'XX'
    const now = new Date()
    const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`
    const seq = String((count ?? 0) + 1).padStart(3, '0')
    const transferNumber = `H1-${fromCode}-${toCode}-TRF-${yymm}-${seq}`

    const totalValue = lines.reduce((sum, l) => sum + l.transfer_qty, 0)

    const { data, error } = await supabase
      .from('stock_transfers')
      .insert({
        transfer_number: transferNumber,
        from_centre_id: fromCentreId,
        to_centre_id: toCentreId,
        status,
        transfer_date: now.toISOString().split('T')[0],
        item_count: lines.length,
        total_value: totalValue,
        notes: remarks.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    // Insert transfer items
    const transferItems = lines.map(l => ({
      transfer_id: data.id,
      item_id: l.item_id,
      requested_qty: l.transfer_qty,
      dispatched_qty: 0,
      received_qty: 0,
    }))

    await supabase.from('stock_transfer_items').insert(transferItems)

    toast.success(`Transfer ${transferNumber} created as ${status}`)
    router.push('/inventory/transfers')
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Stock Transfer</h1>
          <p className="page-subtitle">Transfer items between hospital centres</p>
        </div>
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
      </div>

      {/* Centre Selection */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-navy-600 uppercase tracking-wide mb-4">Transfer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="form-label">From Centre *</label>
            <select
              className="form-select"
              value={fromCentreId}
              onChange={e => { setFromCentreId(e.target.value); setLines([]) }}
            >
              <option value="">Select source centre</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
            <FieldError message={errors.from} />
          </div>

          <div className="flex items-center justify-center pt-6">
            <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center">
              <ArrowLeftRight size={18} className="text-navy-600" />
            </div>
          </div>

          <div>
            <label className="form-label">To Centre *</label>
            <select
              className="form-select"
              value={toCentreId}
              onChange={e => setToCentreId(e.target.value)}
            >
              <option value="">Select destination centre</option>
              {centres.filter(c => c.id !== fromCentreId).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
            <FieldError message={errors.to} />
          </div>
        </div>

        <div className="mt-4">
          <label className="form-label">Remarks</label>
          <textarea
            className="form-input"
            rows={2}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Optional transfer notes"
          />
        </div>
      </div>

      {/* Items */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b bg-navy-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-600 uppercase tracking-wide">
            Transfer Items ({lines.length})
          </h2>
          {fromCentreId && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Item
              </button>
              <BarcodeScanButton onScan={async (code) => {
                if (!fromCentreId) { toast.error('Select source centre first'); return }
                const { data } = await supabase.from('item_centre_stock')
                  .select('item_id, current_stock, item:items(item_code, generic_name, unit)')
                  .eq('centre_id', fromCentreId)
                  .gt('current_stock', 0)
                const match = (data || []).find((s: any) => s.item?.item_code === code || s.item?.item_code?.toLowerCase() === code.toLowerCase())
                if (match) { addLine(match as any); toast.success(`Added: ${(match as any).item?.generic_name}`) }
                else { setShowSearch(true); setSearchTerm(code); toast.error(`No stock match for "${code}"`) }
              }} label="Scan" scanType="item" />
            </div>
          )}
        </div>

        {/* Item Search */}
        {showSearch && fromCentreId && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="form-input pl-10"
                placeholder="Search items by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg bg-white max-h-48 overflow-y-auto">
                {searchResults.map(item => (
                  <button
                    key={item.item_id}
                    onClick={() => addLine(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-teal-50 flex items-center justify-between border-b last:border-b-0 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.generic_name}</div>
                      <div className="text-xs text-gray-500">{item.item_code}</div>
                    </div>
                    <span className="text-xs font-semibold text-teal-500 bg-teal-50 px-2 py-1 rounded">
                      {item.available_stock} {item.unit} available
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searchTerm.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">No items with stock found at source centre</p>
            )}
          </div>
        )}

        <FieldError message={errors.items} show={!!errors.items} />

        {lines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Unit</th>
                  <th>Available</th>
                  <th>Transfer Qty</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={line.item_id}>
                    <td className="text-gray-500">{idx + 1}</td>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{line.item_code}</span>
                    </td>
                    <td className="font-medium text-gray-900">{line.generic_name}</td>
                    <td className="text-gray-600">{line.unit}</td>
                    <td>
                      <span className="text-sm font-semibold text-teal-500">{line.available_stock}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input w-24 text-center"
                        value={line.transfer_qty}
                        min={1}
                        max={line.available_stock}
                        onChange={e => updateQty(idx, parseInt(e.target.value) || 0)}
                      />
                      <FieldError message={errors[`qty_${idx}`]} />
                    </td>
                    <td>
                      <button
                        onClick={() => removeLine(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <ArrowLeftRight size={32} className="text-gray-500 mb-2" />
            <p className="text-sm text-gray-500">
              {fromCentreId ? 'Click "Add Item" to search and add items to transfer' : 'Select a source centre first'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {lines.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-navy-600">{lines.length}</span> items,{' '}
            <span className="font-semibold text-navy-600">{lines.reduce((s, l) => s + l.transfer_qty, 0)}</span> total units
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="btn-secondary flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit('approved')}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeftRight size={16} />}
              Submit Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
