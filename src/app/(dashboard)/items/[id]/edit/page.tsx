'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { trackChanges, computeDiff } from '@/lib/audit-trail'

const UNITS = ['Nos', 'Strip', 'Tablet', 'Capsule', 'Vial', 'Ampoule', 'Bottle', 'Tube', 'Box', 'Pack', 'Kit', 'Pair', 'Litre', 'ML', 'Kg', 'Gram', 'Metre', 'Roll', 'Each', 'Set']
const DEPARTMENTS = ['Pharmacy', 'Store', 'OT', 'CSSD', 'Biomedical', 'Housekeeping', 'Kitchen', 'Linen', 'Admin', 'Other']
const GST_SLABS = ['0', '5', '12', '18', '28']

const EDITABLE_FIELDS = [
  'generic_name', 'brand_name', 'manufacturer', 'marketed_by', 'category_id', 'department',
  'unit', 'purchase_unit', 'issue_unit', 'conversion_factor', 'strength', 'dosage_form', 'route_of_administration',
  'therapeutic_class', 'specification', 'combination_of_drugs',
  'hsn_code', 'gst_percent', 'gst_slab', 'default_rate', 'mrp',
  'reorder_level', 'min_stock', 'max_stock', 'safety_stock', 'lead_time_days',
  'storage_location', 'bin_location', 'shelf_life_days',
  'is_active', 'is_cold_chain', 'is_narcotic', 'is_high_alert', 'is_consignment',
  'ecw_item_code', 'tally_item_name', 'notes',
]

export default function EditItemPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [original, setOriginal] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: item }, { data: cats }] = await Promise.all([
        supabase.from('items').select('*').eq('id', itemId).single(),
        supabase.from('item_categories').select('id, code, name').eq('is_active', true).order('name'),
      ])
      if (!item) { toast.error('Item not found'); router.push('/items'); return }
      setOriginal(item)
      setForm({ ...item, gst_slab: String(item.gst_percent || 12) })
      setCategories(cats || [])
      setPageLoading(false)
    }
    load()
  }, [itemId])

  function update(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
    if (field === 'gst_slab') {
      const gst = parseFloat(value) || 0
      setForm((prev: any) => ({ ...prev, gst_percent: gst, cgst_percent: gst / 2, sgst_percent: gst / 2, igst_percent: gst }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.generic_name?.trim()) { toast.error('Item name is required'); return }
    setLoading(true)

    try {
      const gstPercent = parseFloat(form.gst_slab) || 0
      const payload: any = {
        generic_name: form.generic_name.trim(),
        brand_name: form.brand_name?.trim() || null,
        manufacturer: form.manufacturer?.trim() || null,
        marketed_by: form.marketed_by?.trim() || null,
        category_id: form.category_id || null,
        department: form.department || null,
        unit: form.unit || 'Nos',
        purchase_unit: form.purchase_unit || null,
        issue_unit: form.issue_unit || null,
        conversion_factor: parseFloat(form.conversion_factor) || 1,
        strength: form.strength?.trim() || null,
        dosage_form: form.dosage_form || null,
        therapeutic_class: form.therapeutic_class?.trim() || null,
        hsn_code: form.hsn_code?.trim() || null,
        gst_percent: gstPercent,
        gst_slab: String(gstPercent) || null,
        cgst_percent: gstPercent / 2,
        sgst_percent: gstPercent / 2,
        igst_percent: gstPercent,
        default_rate: form.default_rate ? parseFloat(form.default_rate) : null,
        mrp: form.mrp ? parseFloat(form.mrp) : null,
        reorder_level: form.reorder_level ? parseInt(form.reorder_level) : 0,
        min_stock: form.min_stock ? parseInt(form.min_stock) : 0,
        max_stock: form.max_stock ? parseInt(form.max_stock) : null,
        safety_stock: form.safety_stock ? parseInt(form.safety_stock) : 0,
        lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : 7,
        storage_location: form.storage_location?.trim() || null,
        bin_location: form.bin_location?.trim() || null,
        shelf_life_days: form.shelf_life_days ? parseInt(form.shelf_life_days) : null,
        is_active: form.is_active !== false,
        is_cold_chain: !!form.is_cold_chain,
        is_narcotic: !!form.is_narcotic,
        is_high_alert: !!form.is_high_alert,
        is_consignment: !!form.is_consignment,
        ecw_item_code: form.ecw_item_code?.trim() || null,
        tally_item_name: form.tally_item_name?.trim() || null,
        notes: form.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('items').update(payload).eq('id', itemId)
      if (error) { toast.error(`Save failed: ${error.message}`); setLoading(false); return }

      // Audit trail (non-blocking)
      try {
        const changes = computeDiff(original, payload, EDITABLE_FIELDS)
        if (Object.keys(changes).length > 0) {
          trackChanges({ entity_type: 'item', entity_id: itemId, changes })
        }
      } catch { /* non-critical */ }

      toast.success(`${form.item_code} updated`)
      router.push(`/items/${itemId}`)
    } catch (err: any) {
      console.error('Item edit error:', err)
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  if (pageLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-navy-600" /></div>

  return (
    <div className="max-w-4xl">
      <Link href={`/items/${itemId}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back to Item</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Item — {form.item_code}</h1>
          <p className="page-subtitle">{form.generic_name}</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Item Code</label><input className="form-input bg-gray-50" disabled value={form.item_code} /></div>
            <div><label className="form-label">Generic Name *</label><input className="form-input" value={form.generic_name || ''} onChange={e => update('generic_name', e.target.value)} /></div>
            <div><label className="form-label">Brand Name</label><input className="form-input" value={form.brand_name || ''} onChange={e => update('brand_name', e.target.value)} /></div>
            <div><label className="form-label">Manufacturer</label><input className="form-input" value={form.manufacturer || ''} onChange={e => update('manufacturer', e.target.value)} /></div>
            <div><label className="form-label">Category</label>
              <select className="form-select" value={form.category_id || ''} onChange={e => update('category_id', e.target.value)}>
                <option value="">None</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Department</label>
              <select className="form-select" value={form.department || ''} onChange={e => update('department', e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className="form-label">Base Unit (dispensing)</label>
              <select className="form-select" value={form.unit || 'Nos'} onChange={e => update('unit', e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="form-label">Purchase Unit</label>
              <select className="form-select" value={form.purchase_unit || form.unit || 'Nos'} onChange={e => update('purchase_unit', e.target.value)}>
                {['Strip', 'Box', 'Bottle', 'Vial', 'Ampoule', 'Tube', 'Packet', 'Bag', 'Can', 'Roll', ...UNITS].filter((v, i, a) => a.indexOf(v) === i).map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="form-label">Conversion Factor</label>
              <input type="number" min="1" step="1" className="form-input" value={form.conversion_factor || 1} onChange={e => update('conversion_factor', e.target.value)} placeholder="e.g. 10 (1 strip = 10 tablets)" />
              <span className="text-[10px] text-gray-500 mt-0.5 block">1 {form.purchase_unit || 'purchase unit'} = {form.conversion_factor || 1} {form.unit || 'base unit'}</span>
            </div>
            <div><label className="form-label">Strength</label><input className="form-input" value={form.strength || ''} onChange={e => update('strength', e.target.value)} /></div>
          </div>
        </div>

        {/* Pricing & Tax */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Pricing & Tax</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="form-label">HSN Code</label><input className="form-input" value={form.hsn_code || ''} onChange={e => update('hsn_code', e.target.value)} /></div>
            <div><label className="form-label">GST %</label>
              <select className="form-select" value={form.gst_slab || '12'} onChange={e => update('gst_slab', e.target.value)}>
                {GST_SLABS.map(s => <option key={s} value={s}>{s}%</option>)}
              </select>
            </div>
            <div><label className="form-label">Default Rate (₹)</label><input type="number" step="0.01" className="form-input" value={form.default_rate || ''} onChange={e => update('default_rate', e.target.value)} /></div>
            <div><label className="form-label">MRP (₹)</label><input type="number" step="0.01" className="form-input" value={form.mrp || ''} onChange={e => update('mrp', e.target.value)} /></div>
          </div>
        </div>

        {/* Stock Levels */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Stock Parameters</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><label className="form-label">Reorder Level</label><input type="number" className="form-input" value={form.reorder_level || ''} onChange={e => update('reorder_level', e.target.value)} /></div>
            <div><label className="form-label">Min Stock</label><input type="number" className="form-input" value={form.min_stock || ''} onChange={e => update('min_stock', e.target.value)} /></div>
            <div><label className="form-label">Max Stock</label><input type="number" className="form-input" value={form.max_stock || ''} onChange={e => update('max_stock', e.target.value)} /></div>
            <div><label className="form-label">Safety Stock</label><input type="number" className="form-input" value={form.safety_stock || ''} onChange={e => update('safety_stock', e.target.value)} /></div>
            <div><label className="form-label">Lead Time (days)</label><input type="number" className="form-input" value={form.lead_time_days || ''} onChange={e => update('lead_time_days', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div><label className="form-label">Storage Location</label><input className="form-input" value={form.storage_location || ''} onChange={e => update('storage_location', e.target.value)} placeholder="e.g. Pharmacy Store A" /></div>
            <div><label className="form-label">Bin Location</label><input className="form-input" value={form.bin_location || ''} onChange={e => update('bin_location', e.target.value)} placeholder="e.g. Rack 3, Shelf B" /></div>
          </div>
        </div>

        {/* Flags */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Flags & Integration</h2>
          <div className="flex gap-6 flex-wrap mb-4">
            {[
              { key: 'is_active', label: 'Active' }, { key: 'is_cold_chain', label: 'Cold Chain' },
              { key: 'is_narcotic', label: 'Narcotic' }, { key: 'is_high_alert', label: 'High Alert' },
              { key: 'is_consignment', label: 'Consignment' },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form[f.key]} onChange={e => update(f.key, e.target.checked)} className="w-4 h-4 accent-teal-500" />
                {f.label}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">eCW Item Code</label><input className="form-input" value={form.ecw_item_code || ''} onChange={e => update('ecw_item_code', e.target.value)} /></div>
            <div><label className="form-label">Tally Item Name</label><input className="form-input" value={form.tally_item_name || ''} onChange={e => update('tally_item_name', e.target.value)} /></div>
          </div>
          <div className="mt-4"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={form.notes || ''} onChange={e => update('notes', e.target.value)} /></div>
        </div>
      </form>
    </div>
  )
}
