'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRightLeft, Save, Loader2, Trash2, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface SubStore { id: string; centre_id: string; code: string; name: string; centre?: any }
interface TransferLine { item_id: string; item_code: string; generic_name: string; unit: string; available_qty: number; qty: number; rate: number; batch_number: string; notes: string }

export default function NewSubStoreTransferPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [subStores, setSubStores] = useState<SubStore[]>([])
  const [fromStoreId, setFromStoreId] = useState('')
  const [toStoreId, setToStoreId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<TransferLine[]>([])

  // Item search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase.from('user_profiles').select('centre_id, role').eq('id', (await supabase.auth.getUser()).data.user?.id).single()
      const { data: stores } = await supabase
        .from('sub_stores')
        .select('id, centre_id, code, name, centre:centres(code, name)')
        .eq('is_active', true)
        .order('code')

      if (stores) {
        // Filter by centre for non-group users
        const filtered = profile?.role && ['group_admin', 'group_cao'].includes(profile.role)
          ? stores
          : stores.filter(s => s.centre_id === profile?.centre_id)
        setSubStores(filtered)

        // Default: from = Main Store
        const main = filtered.find(s => s.code === 'MAIN')
        if (main) setFromStoreId(main.id)
      }
      setPageLoading(false)
    }
    load()
  }, [])

  // Search items with stock in the from-store
  const searchItems = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !fromStoreId) { setSearchResults([]); return }
    setSearching(true)

    const { data } = await supabase
      .from('item_substore_stock')
      .select('item_id, current_stock, item:items(id, item_code, generic_name, unit)')
      .eq('sub_store_id', fromStoreId)
      .gt('current_stock', 0)
      .or(`item.item_code.ilike.%${q}%,item.generic_name.ilike.%${q}%`)
      .limit(10)

    // Filter out already-added items
    const addedIds = new Set(lines.map(l => l.item_id))
    setSearchResults((data || []).filter((r: any) => {
      const item = Array.isArray(r.item) ? r.item[0] : r.item
      return item && !addedIds.has(item.id)
    }))
    setSearching(false)
  }, [fromStoreId, lines, supabase])

  useEffect(() => {
    const timer = setTimeout(() => searchItems(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchItems])

  function addItem(result: any) {
    const item = Array.isArray(result.item) ? result.item[0] : result.item
    setLines(prev => [...prev, {
      item_id: item.id,
      item_code: item.item_code,
      generic_name: item.generic_name,
      unit: item.unit || 'Nos',
      available_qty: result.current_stock,
      qty: 1,
      rate: 0,
      batch_number: '',
      notes: '',
    }])
    setSearchQuery('')
    setSearchResults([])
  }

  function updateLine(idx: number, field: string, value: any) {
    setLines(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      // Cap qty at available
      if (field === 'qty') {
        updated[idx].qty = Math.min(Math.max(0, Number(value) || 0), updated[idx].available_qty)
      }
      return updated
    })
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromStoreId) { toast.error('Select source store'); return }
    if (!toStoreId) { toast.error('Select destination store'); return }
    if (fromStoreId === toStoreId) { toast.error('Source and destination must be different'); return }
    if (lines.length === 0) { toast.error('Add at least one item'); return }
    if (lines.some(l => l.qty <= 0)) { toast.error('All items must have quantity > 0'); return }

    setLoading(true)

    try {
      const res = await fetch('/api/sub-store/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_sub_store_id: fromStoreId,
          to_sub_store_id: toStoreId,
          notes: notes.trim() || null,
          items: lines.map(l => ({
            item_id: l.item_id,
            item_name: l.generic_name,
            qty: l.qty,
            rate: l.rate,
            unit: l.unit,
            batch_number: l.batch_number || null,
            notes: l.notes || null,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.details) {
          data.details.forEach((d: string) => toast.error(d, { duration: 5000 }))
        }
        toast.error(data.error || 'Transfer failed')
        setLoading(false)
        return
      }

      toast.success(data.message || 'Transfer created')
      router.push('/inventory/transfers')
    } catch (err: any) {
      toast.error(err?.message || 'Network error')
    }
    setLoading(false)
  }

  const fromStore = subStores.find(s => s.id === fromStoreId)
  const toStore = subStores.find(s => s.id === toStoreId)
  // For destination, show all stores from same centre except fromStore
  const destinationStores = subStores.filter(s =>
    s.centre_id === fromStore?.centre_id && s.id !== fromStoreId
  )

  if (pageLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-navy-600" /></div>
  }

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <div>
          <Link href="/inventory/transfers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Transfers
          </Link>
          <h1 className="page-title">New Sub-Store Transfer</h1>
          <p className="page-subtitle">Transfer stock between sub-stores within a centre</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create Transfer</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From / To selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Transfer Direction</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">From Store *</label>
              <select className="form-select" value={fromStoreId}
                onChange={e => { setFromStoreId(e.target.value); setToStoreId(''); setLines([]) }}>
                <option value="">Select source...</option>
                {subStores.map(s => {
                  const c = Array.isArray(s.centre) ? s.centre[0] : s.centre
                  return <option key={s.id} value={s.id}>{c?.code} — {s.name}</option>
                })}
              </select>
            </div>
            <div>
              <label className="form-label">To Store *</label>
              <select className="form-select" value={toStoreId}
                onChange={e => setToStoreId(e.target.value)} disabled={!fromStoreId}>
                <option value="">Select destination...</option>
                {destinationStores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {fromStore && toStore && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
              <ArrowRightLeft size={16} className="text-teal-600" />
              <span className="text-sm font-medium text-teal-800">
                {fromStore.name} → {toStore.name}
              </span>
            </div>
          )}

          <div className="mt-4">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="Reason for transfer, urgency, etc." />
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Transfer Items</h2>

          {/* Item search */}
          {fromStoreId && (
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="form-input pl-10"
                placeholder="Search items by code or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((r: any) => {
                    const item = Array.isArray(r.item) ? r.item[0] : r.item
                    if (!item) return null
                    return (
                      <button key={item.id} type="button"
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0"
                        onClick={() => addItem(r)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs text-gray-500">{item.item_code}</span>
                            <span className="ml-2 text-sm font-medium text-gray-900">{item.generic_name}</span>
                          </div>
                          <span className="text-xs font-medium text-teal-600">{r.current_stock} {item.unit} avail.</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              {searching && <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg p-4 text-center text-sm text-gray-500"><Loader2 size={14} className="animate-spin inline mr-2" />Searching...</div>}
            </div>
          )}

          {/* Line items table */}
          {lines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Item</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Available</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Transfer qty</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Unit</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="text-xs font-mono text-gray-500">{line.item_code}</div>
                        <div className="text-sm font-medium text-gray-900">{line.generic_name}</div>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-600">{line.available_qty}</td>
                      <td className="px-3 py-2 text-center">
                        <input type="number" min={1} max={line.available_qty}
                          className="form-input w-20 text-center text-sm"
                          value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} />
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-500">{line.unit}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeLine(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-sm">
              {fromStoreId ? 'Search and add items to transfer' : 'Select a source store first'}
            </div>
          )}
        </div>

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading || lines.length === 0} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><ArrowRightLeft size={16} /> Create Transfer</>}
          </button>
          <Link href="/inventory/transfers" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
