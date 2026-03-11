'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const UNITS = ['Tablets', 'Capsules', 'Vials', 'Ampoules', 'Bottles', 'Strips', 'Nos', 'Box', 'Pack', 'Roll', 'Kg', 'Gm', 'Litre', 'ML', 'Pair', 'Set']
const GST_RATES = [0, 5, 12, 18, 28]

export default function NewItemPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  const [form, setForm] = useState({
    generic_name: '',
    brand_name: '',
    category_id: '',
    unit: 'Nos',
    hsn_code: '',
    gst_percent: '12',
    shelf_life_days: '',
    is_cold_chain: false,
    is_narcotic: false,
    is_high_alert: false,
    ecw_item_code: '',
    tally_item_name: '',
    notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('item_categories')
        .select('id, name, code, parent_id')
        .eq('is_active', true)
        .order('name')
      if (data) setCategories(data)
    }
    load()
  }, [])

  function update(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.generic_name.trim()) { toast.error('Generic name required'); return }
    if (!form.unit) { toast.error('Unit required'); return }

    setLoading(true)
    const { count } = await supabase.from('items').select('*', { count: 'exact', head: true })
    const seq = (count ?? 0) + 1
    const item_code = `H1I-${String(seq).padStart(5, '0')}`

    const { data, error } = await supabase.from('items').insert({
      item_code,
      generic_name: form.generic_name.trim(),
      brand_name: form.brand_name.trim() || null,
      category_id: form.category_id || null,
      unit: form.unit,
      hsn_code: form.hsn_code.trim() || null,
      gst_percent: parseFloat(form.gst_percent),
      shelf_life_days: form.shelf_life_days ? parseInt(form.shelf_life_days) : null,
      is_cold_chain: form.is_cold_chain,
      is_narcotic: form.is_narcotic,
      is_high_alert: form.is_high_alert,
      ecw_item_code: form.ecw_item_code.trim() || null,
      tally_item_name: form.tally_item_name.trim() || null,
      notes: form.notes.trim() || null,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success(`Item ${item_code} created`)
    router.push(`/items/${data.id}`)
  }

  const parentCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id)

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <div>
          <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Items
          </Link>
          <h1 className="page-title">Add New Item</h1>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Item</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Item Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Generic Name *</label>
              <input className="form-input" value={form.generic_name} onChange={e => update('generic_name', e.target.value)} placeholder="e.g. Amoxicillin 500mg" required />
            </div>
            <div>
              <label className="form-label">Brand Name</label>
              <input className="form-input" value={form.brand_name} onChange={e => update('brand_name', e.target.value)} placeholder="e.g. Mox 500" />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={e => update('category_id', e.target.value)}>
                <option value="">Select category</option>
                {parentCategories.map(c => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name} (general)</option>
                    {subCategories.filter(s => s.parent_id === c.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Unit of Measure *</label>
              <select className="form-select" value={form.unit} onChange={e => update('unit', e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">GST Rate</label>
              <select className="form-select" value={form.gst_percent} onChange={e => update('gst_percent', e.target.value)}>
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">HSN Code</label>
              <input className="form-input" value={form.hsn_code} onChange={e => update('hsn_code', e.target.value)} placeholder="e.g. 3004" />
            </div>
            <div>
              <label className="form-label">Shelf Life (days)</label>
              <input type="number" className="form-input" value={form.shelf_life_days} onChange={e => update('shelf_life_days', e.target.value)} placeholder="e.g. 730" min="1" />
            </div>
          </div>
        </div>

        {/* Flags */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Special Flags</h2>
          <div className="flex flex-wrap gap-6">
            {[
              { field: 'is_cold_chain', label: 'Cold Chain Required', desc: 'Requires refrigeration 2-8°C' },
              { field: 'is_narcotic', label: 'Narcotic / Schedule H', desc: 'Controlled substance' },
              { field: 'is_high_alert', label: 'High Alert Medication', desc: 'ISMP high-alert drug' },
            ].map(f => (
              <label key={f.field} className="flex items-start gap-3 cursor-pointer">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={form[f.field as keyof typeof form] as boolean}
                    onChange={e => update(f.field, e.target.checked)}
                    className="w-4 h-4 accent-[#0D7E8A]"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{f.label}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Integration */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Integration Mapping</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">eClinicalworks Item Code</label>
              <input className="form-input" value={form.ecw_item_code} onChange={e => update('ecw_item_code', e.target.value)} placeholder="eCW item code for consumption sync" />
            </div>
            <div>
              <label className="form-label">Tally Item Name</label>
              <input className="form-input" value={form.tally_item_name} onChange={e => update('tally_item_name', e.target.value)} placeholder="Exact name in Tally stock item" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Item</>}
          </button>
          <Link href="/items" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
