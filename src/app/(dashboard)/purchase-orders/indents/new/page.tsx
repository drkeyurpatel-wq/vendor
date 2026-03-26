'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2, AlertTriangle, Package, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatCurrency } from '@/lib/utils'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'

interface IndentItem {
  id: string
  item_id: string
  item_code: string
  generic_name: string
  brand_name: string
  unit: string
  requested_qty: number
  current_stock: number
  reorder_level: number
  last_purchase_rate: number
  estimated_value: number
  notes: string
}

export default function NewIndentPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [centres, setCentres] = useState<any[]>([])
  const [centreId, setCentreId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<IndentItem[]>([])

  // Item search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: cens }] = await Promise.all([
        supabase.from('user_profiles').select('*, centre:centres(*)').eq('id', user.id).single(),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
      ])
      if (prof) { setProfile(prof); setCentreId(prof.centre_id || '') }
      if (cens) setCentres(cens)
    }
    load()
  }, [])

  // Debounced item search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true)
      const q = searchQuery.trim()
      const { data } = await supabase
        .from('items')
        .select('id, item_code, generic_name, brand_name, unit, gst_percent, category:item_categories(name)')
        .is('deleted_at', null)
        .eq('is_active', true)
        .or(`generic_name.ilike.%${q}%,item_code.ilike.%${q}%,brand_name.ilike.%${q}%`)
        .limit(10)
      setSearchResults(data ?? [])
      setSearchLoading(false)
    }, 250)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  const addItem = useCallback(async (item: any) => {
    // Check if already added
    if (items.some(i => i.item_id === item.id)) {
      toast.error('Item already in indent')
      return
    }

    // Fetch stock for selected centre
    let stock = 0, reorder = 0, lastRate = 0
    if (centreId) {
      const { data: stockData } = await supabase
        .from('item_centre_stock')
        .select('current_stock, reorder_level, last_grn_rate')
        .eq('item_id', item.id)
        .eq('centre_id', centreId)
        .single()
      if (stockData) {
        stock = stockData.current_stock || 0
        reorder = stockData.reorder_level || 0
        lastRate = stockData.last_grn_rate || 0
      }
    }

    const suggestedQty = Math.max(reorder - stock, 0)

    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      item_id: item.id,
      item_code: item.item_code,
      generic_name: item.generic_name,
      brand_name: item.brand_name || '',
      unit: item.unit,
      requested_qty: suggestedQty || 1,
      current_stock: stock,
      reorder_level: reorder,
      last_purchase_rate: lastRate,
      estimated_value: (suggestedQty || 1) * lastRate,
      notes: '',
    }])

    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
  }, [items, centreId, supabase])

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = (id: string, field: keyof IndentItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'requested_qty') {
        updated.estimated_value = (parseFloat(value) || 0) * item.last_purchase_rate
      }
      return updated
    }))
  }

  const totalEstimated = items.reduce((s, i) => s + i.estimated_value, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!centreId) { toast.error('Select a centre'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    if (items.some(i => i.requested_qty <= 0)) { toast.error('All quantities must be > 0'); return }

    setLoading(true)
    const centreCode = centres.find(c => c.id === centreId)?.code || 'XXX'

    // Get indent number via sequence API
    let indentNumber: string
    try {
      const seqRes = await fetch(`/api/sequence?type=indent&centre_code=${centreCode}`)
      const seqData = await seqRes.json()
      indentNumber = seqData.number || `H1-${centreCode}-IND-${Date.now()}`
    } catch {
      indentNumber = `H1-${centreCode}-IND-${Date.now()}`
    }

    const { data: indent, error } = await supabase.from('purchase_indents').insert({
      indent_number: indentNumber,
      centre_id: centreId,
      requested_by: profile?.id,
      status: 'submitted',
      priority,
      notes: notes.trim() || null,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Insert line items
    const lineItems = items.map(item => ({
      indent_id: indent.id,
      item_id: item.item_id,
      requested_qty: item.requested_qty,
      unit: item.unit,
      current_stock: item.current_stock,
      last_purchase_rate: item.last_purchase_rate,
      estimated_value: item.estimated_value,
      notes: item.notes.trim() || null,
    }))

    const { error: itemError } = await supabase.from('purchase_indent_items').insert(lineItems)
    if (itemError) { toast.error(itemError.message); setLoading(false); return }

    toast.success(`Indent ${indentNumber} created`)
    router.push('/purchase-orders/indents')
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/purchase-orders/indents" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Indents
          </Link>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">New Purchase Indent</h1>
          <p className="text-sm text-gray-500 mt-1">Request items for procurement</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Save size={16} /> Submit Indent</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Centre + Priority */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-6">
          <h2 className="text-sm font-semibold text-navy-600 mb-4 pb-3 border-b border-gray-100">Indent Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Centre *</label>
              <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)} required>
                <option value="">Select centre</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for request..." />
            </div>
          </div>
        </div>

        {/* Item Search + Line Items */}
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy-600">Items ({items.length})</h2>
            {totalEstimated > 0 && (
              <span className="text-sm font-semibold text-gray-700">
                Est. Value: <span className="text-navy-600">{formatCurrency(totalEstimated)}</span>
              </span>
            )}
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }}
                onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                placeholder="Search items by name, code, or brand..."
                className="form-input pl-10"
              />

              {/* Search dropdown */}
              {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-elevated max-h-64 overflow-y-auto">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No items found</div>
                ) : (
                  searchResults.map(item => {
                    const alreadyAdded = items.some(i => i.item_id === item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addItem(item)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors',
                          alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                        )}
                      >
                        <Package size={14} className="text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{item.generic_name}</div>
                          <div className="text-xs text-gray-500">
                            {item.item_code} {item.brand_name ? `· ${item.brand_name}` : ''} · {item.unit} · {item.category?.name}
                          </div>
                        </div>
                        {alreadyAdded ? (
                          <span className="text-2xs text-gray-500">Added</span>
                        ) : (
                          <Plus size={14} className="text-teal-600 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
          <BarcodeScanButton onScan={async (code) => {
            const { data } = await supabase.from('items').select('id, item_code, generic_name, brand_name, unit, gst_percent').eq('is_active', true).or(`item_code.eq.${code},item_code.ilike.${code}`).limit(1)
            if (data?.[0]) { addItem(data[0]); toast.success(`Added: ${data[0].generic_name}`) }
            else { setSearchQuery(code); toast.error(`No match for "${code}" — showing search`) }
          }} label="Scan" scanType="item" />
          </div>

          {/* Line items table */}
          {items.length > 0 ? (
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy-600 text-white">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Item</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider">Current Stock</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider">Reorder Level</th>
                    <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider w-32">Qty Requested *</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider">Last Rate</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider">Est. Value</th>
                    <th className="px-4 py-2.5 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const belowReorder = item.current_stock < item.reorder_level
                    const outOfStock = item.current_stock === 0
                    return (
                      <tr key={item.id} className={cn('border-b border-gray-100', idx % 2 === 1 && 'bg-gray-50/30')}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-sm text-gray-900">{item.generic_name}</div>
                          <div className="text-xs text-gray-500">
                            <span className="font-mono">{item.item_code}</span>
                            {item.brand_name && ` · ${item.brand_name}`} · {item.unit}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'text-sm font-semibold',
                            outOfStock ? 'text-red-600' : belowReorder ? 'text-amber-600' : 'text-green-600'
                          )}>
                            {item.current_stock}
                          </span>
                          {outOfStock && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{item.reorder_level}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.requested_qty}
                            onChange={e => updateItem(item.id, 'requested_qty', parseFloat(e.target.value) || 0)}
                            className="form-input text-center text-sm w-full"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono text-gray-600">
                          {item.last_purchase_rate > 0 ? `₹${item.last_purchase_rate.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800 font-mono">
                          {item.estimated_value > 0 ? formatCurrency(item.estimated_value) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-gray-500 hover:text-red-500 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                      Total Estimated Value:
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-navy-600 font-mono">
                      {formatCurrency(totalEstimated)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package size={32} className="mx-auto text-gray-500 mb-3" />
              <p className="text-sm text-gray-500 font-medium">No items added yet</p>
              <p className="text-xs text-gray-500 mt-1">Search and add items above to create your indent</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Save size={16} /> Submit Indent</>}
          </button>
          <Link href="/purchase-orders/indents" className="btn-secondary">Cancel</Link>
        </div>
      </form>

      {/* Click outside to close search */}
      {searchOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
      )}
    </div>
  )
}
