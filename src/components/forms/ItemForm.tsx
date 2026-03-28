'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'

const DEPARTMENTS = ['Medical', 'Surgical', 'Dental', 'Lab', 'Radiology', 'Dietary', 'Housekeeping', 'Engineering', 'IT', 'General']
const ITEM_TYPES = [
  { value: 'drug', label: 'Drug' }, { value: 'consumable', label: 'Consumable' },
  { value: 'surgical', label: 'Surgical' }, { value: 'implant', label: 'Implant' },
  { value: 'equipment', label: 'Equipment' }, { value: 'reagent', label: 'Reagent' },
  { value: 'linen', label: 'Linen' }, { value: 'stationery', label: 'Stationery' },
  { value: 'food', label: 'Food' }, { value: 'other', label: 'Other' },
]
const UNITS = [
  'Tablet', 'Capsule', 'Vial', 'Ampoule', 'Bottle', 'Strip', 'Nos', 'Box', 'Pack',
  'Roll', 'Kg', 'Gm', 'Litre', 'ML', 'Pair', 'Set', 'Tube', 'Sachet', 'Bag',
  'Can', 'Drum', 'Ream', 'Cartridge', 'Piece'
]
const GST_SLABS = ['0', '5', '12', '18', '28']
const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Infusion', 'Cream',
  'Ointment', 'Gel', 'Drops', 'Inhaler', 'Powder', 'Granules', 'Suppository',
  'Patch', 'Spray', 'Solution', 'Other'
]

const defaultForm = {
  brand_name: '', generic_name: '', manufacturer: '',
  department: 'Medical', item_type: 'drug', category_id: '',
  unit: 'Nos', purchase_unit: '', hsn_code: '', gst_slab: '12',
  default_rate: '', mrp: '', strength: '', dosage_form: '',
  combination_of_drugs: '', marketed_by: '', therapeutic_class: '',
  specification: '', route_of_administration: '',
  major_group: '', minor_group: '',
  issue_unit: '', qty_conversion: '1',
  item_nature_abc: '', item_nature_ved: '', item_nature_fsn: '',
  is_generic: false, is_cold_chain: false, is_narcotic: false,
  is_high_alert: false, is_stockable: true, is_consignment: false,
  scheduled_drug: false, scheduled_drug_category: '',
  shelf_life_days: '', storage_location: '', bin_location: '',
  reorder_point: '', safety_stock: '', min_order_qty: '', lead_time_days: '',
  tally_item_name: '', remarks: '',
}
type FormState = typeof defaultForm

function Req() { return <span className="text-red-500 font-bold ml-0.5">*</span> }

export default function ItemForm({ mode = 'create', initialData }: { mode?: 'create' | 'edit'; initialData?: Record<string, any> }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState<FormState>({ ...defaultForm, ...initialData } as FormState)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)

  function touch(f: string) { setTouched(prev => new Set(prev).add(f)) }
  function update(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (typeof value === 'string') {
      const err = validate(field, value)
      setErrors(prev => { const n = { ...prev }; if (err) n[field] = err; else delete n[field]; return n })
    }
  }
  function validate(field: keyof FormState, value: string): string | undefined {
    switch (field) {
      case 'brand_name': if (!value.trim()) return 'Brand name is required'; return undefined
      case 'generic_name': if (!value.trim()) return 'Content / drug name is required'; return undefined
      case 'manufacturer': if (!value.trim()) return 'Manufacturer is required'; return undefined
      case 'default_rate': if (!value.trim()) return 'Purchase rate is required'; return undefined
      case 'mrp': if (!value.trim()) return 'MRP is required'; return undefined
      default: return undefined
    }
  }
  function fp(field: keyof FormState) {
    return {
      id: field, value: form[field] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(field, e.target.value),
      onBlur: () => touch(field), 'aria-invalid': touched.has(field) && !!errors[field],
    }
  }
  function errCls(field: keyof FormState) {
    return touched.has(field) && errors[field] ? 'bg-red-50 rounded-lg p-2 ring-1 ring-red-300' : ''
  }

  useEffect(() => {
    supabase.from('item_categories').select('id, name, code, parent_id').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  const margin = form.default_rate && form.mrp && parseFloat(form.mrp) > 0
    ? ((1 - parseFloat(form.default_rate) / parseFloat(form.mrp)) * 100).toFixed(1) : null

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const mandatory: (keyof FormState)[] = ['brand_name', 'generic_name', 'manufacturer', 'default_rate', 'mrp']
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    for (const f of mandatory) { const err = validate(f, form[f] as string); if (err) newErrors[f] = err }
    setErrors(newErrors)
    setTouched(new Set(mandatory.map(String)))
    if (Object.keys(newErrors).length > 0) {
      const labels: Record<string, string> = { brand_name: 'Brand Name', generic_name: 'Content/Drug Name', manufacturer: 'Manufacturer', default_rate: 'Purchase Rate', mrp: 'MRP' }
      toast.error(`Missing: ${Object.keys(newErrors).map(f => labels[f] || f).join(', ')}`, { duration: 5000 })
      setTimeout(() => { const el = document.getElementById(Object.keys(newErrors)[0]); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 100)
      return
    }
    if (form.default_rate && form.mrp) {
      const m = (1 - parseFloat(form.default_rate) / parseFloat(form.mrp)) * 100
      if (m < 10 && !window.confirm(`Margin is ${m.toFixed(1)}% (below 10%). Continue?`)) return
    }
    setLoading(true)
    try {
      let item_code: string
      try {
        const r = await fetch('/api/sequence?type=item'); const d = await r.json()
        if (r.ok && d.number) item_code = d.number; else throw new Error()
      } catch {
        const { data: latest } = await supabase.from('items').select('item_code').order('item_code', { ascending: false }).limit(1)
        const lastNum = latest?.[0]?.item_code ? parseInt(latest[0].item_code.replace('H1I-', '')) : 0
        item_code = `H1I-${String((lastNum || 0) + 1).padStart(5, '0')}`
      }
      const gst = parseFloat(form.gst_slab) || 0
      const { data, error } = await supabase.from('items').insert({
        item_code, brand_name: form.brand_name.trim(), generic_name: form.generic_name.trim(),
        manufacturer: form.manufacturer.trim(), department: form.department, item_type: form.item_type || null,
        category_id: form.category_id || null, unit: form.unit || 'Nos',
        purchase_unit: form.purchase_unit || null, issue_unit: form.issue_unit || null,
        qty_conversion: parseFloat(form.qty_conversion) || 1,
        hsn_code: form.hsn_code.trim() || null, gst_percent: gst, gst_slab: form.gst_slab || null,
        cgst_percent: gst / 2, sgst_percent: gst / 2, igst_percent: gst,
        default_rate: parseFloat(form.default_rate) || null, mrp: parseFloat(form.mrp) || null,
        strength: form.strength.trim() || null, dosage_form: form.dosage_form || null,
        combination_of_drugs: form.combination_of_drugs.trim() || null,
        marketed_by: form.marketed_by.trim() || null, therapeutic_class: form.therapeutic_class.trim() || null,
        specification: form.specification.trim() || null, route_of_administration: form.route_of_administration || null,
        major_group: form.major_group.trim() || null, minor_group: form.minor_group.trim() || null,
        item_nature_abc: form.item_nature_abc || null, item_nature_ved: form.item_nature_ved || null,
        item_nature_fsn: form.item_nature_fsn || null,
        is_generic: form.is_generic, is_cold_chain: form.is_cold_chain, is_narcotic: form.is_narcotic,
        is_high_alert: form.is_high_alert, is_stockable: form.is_stockable, is_consignment: form.is_consignment,
        scheduled_drug: form.scheduled_drug, scheduled_drug_category: form.scheduled_drug_category || null,
        shelf_life_days: form.shelf_life_days ? parseInt(form.shelf_life_days) : null,
        storage_location: form.storage_location.trim() || null, bin_location: form.bin_location.trim() || null,
        reorder_point: form.reorder_point ? parseFloat(form.reorder_point) : null,
        safety_stock: form.safety_stock ? parseFloat(form.safety_stock) : null,
        min_order_qty: form.min_order_qty ? parseFloat(form.min_order_qty) : null,
        lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
        tally_item_name: form.tally_item_name.trim() || null, remarks: form.remarks.trim() || null,
      }).select().single()
      if (error) { toast.error(error.message); setLoading(false); return }
      toast.success(`Item ${item_code} created`); router.push(`/items/${data.id}`)
    } catch { toast.error('Failed to create item'); setLoading(false) }
  }

  function SH({ n, title }: { n: number; title: string }) {
    return <div className="font-semibold text-navy-600 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">{n}. {title}</div>
  }

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"><ArrowLeft size={14} /> Back to Items</Link>
          <h1 className="page-title">Add New Item</h1>
        </div>
        <button onClick={() => handleSubmit()} disabled={loading} className="btn-primary cursor-pointer">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Item</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Core Identity */}
        <div className="card p-6"><SH n={1} title="Item Identity" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={errCls('brand_name')}><label className="form-label">Brand Name<Req /></label><input className="form-input" {...fp('brand_name')} placeholder="e.g. Augmentin 625" autoFocus /><FieldError message={errors.brand_name} show={touched.has('brand_name')} /></div>
            <div className={errCls('generic_name')}><label className="form-label">Content / Drug Name<Req /></label><input className="form-input" {...fp('generic_name')} placeholder="e.g. Amoxicillin + Clavulanic Acid" /><FieldError message={errors.generic_name} show={touched.has('generic_name')} /></div>
            <div className={errCls('manufacturer')}><label className="form-label">Manufacturer<Req /></label><input className="form-input" {...fp('manufacturer')} placeholder="e.g. GSK" /><FieldError message={errors.manufacturer} show={touched.has('manufacturer')} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div><label className="form-label">Strength</label><input className="form-input" {...fp('strength')} placeholder="e.g. 500mg" /></div>
            <div><label className="form-label">Dosage Form</label><select className="form-select" value={form.dosage_form} onChange={e => update('dosage_form', e.target.value)}><option value="">Select</option>{DOSAGE_FORMS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label className="form-label">Department</label><select className="form-select" value={form.department} onChange={e => update('department', e.target.value)}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div><label className="form-label">Item Type</label><select className="form-select" value={form.item_type} onChange={e => update('item_type', e.target.value)}>{ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          </div>
        </div>

        {/* 2. Unit & Tax */}
        <div className="card p-6"><SH n={2} title="Unit & Tax" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div><label className="form-label">Base Unit</label><select className="form-select" value={form.unit} onChange={e => update('unit', e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
            <div><label className="form-label">Purchase Unit</label><select className="form-select" value={form.purchase_unit} onChange={e => update('purchase_unit', e.target.value)}><option value="">Same as base</option>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
            <div><label className="form-label">HSN Code</label><input className="form-input font-mono" {...fp('hsn_code')} placeholder="e.g. 30042099" maxLength={8} /></div>
            <div><label className="form-label">GST (%)</label><select className="form-select" value={form.gst_slab} onChange={e => update('gst_slab', e.target.value)}>{GST_SLABS.map(g => <option key={g} value={g}>{g}%</option>)}</select></div>
          </div>
        </div>

        {/* 3. Pricing */}
        <div className="card p-6"><SH n={3} title="Pricing" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={errCls('default_rate')}><label className="form-label">Purchase Rate (₹)<Req /></label><input type="number" step="0.01" min="0" className="form-input" {...fp('default_rate')} placeholder="0.00" /><FieldError message={errors.default_rate} show={touched.has('default_rate')} /></div>
            <div className={errCls('mrp')}><label className="form-label">MRP (₹)<Req /></label><input type="number" step="0.01" min="0" className="form-input" {...fp('mrp')} placeholder="0.00" /><FieldError message={errors.mrp} show={touched.has('mrp')} /></div>
            <div><label className="form-label">Margin</label><div className={`form-input bg-gray-50 font-semibold ${margin && parseFloat(margin) < 10 ? 'text-red-600' : margin && parseFloat(margin) >= 30 ? 'text-green-600' : 'text-gray-900'}`}>{margin ? `${margin}%` : '—'}</div></div>
          </div>
        </div>

        {/* 4. Category */}
        {categories.length > 0 && (
          <div className="card p-6"><SH n={4} title="Category" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div><label className="form-label">Item Category</label><select className="form-select" value={form.category_id} onChange={e => update('category_id', e.target.value)}><option value="">No category</option>{categories.filter(c => !c.parent_id).map(c => (<optgroup key={c.id} label={c.name}><option value={c.id}>{c.name}</option>{categories.filter(sc => sc.parent_id === c.id).map(sc => (<option key={sc.id} value={sc.id}>&nbsp;&nbsp;{sc.name}</option>))}</optgroup>))}</select></div>
            </div>
          </div>
        )}

        {/* Advanced (collapsed) */}
        <div className="card overflow-hidden">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full px-6 py-4 flex items-center justify-between text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            <span>Advanced Settings</span>{showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAdvanced && (
            <div className="px-6 pb-6 space-y-6 border-t border-gray-100 pt-4">
              <div><p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Drug Details</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="form-label">Combination of Drugs</label><input className="form-input" {...fp('combination_of_drugs')} /></div>
                  <div><label className="form-label">Marketed By</label><input className="form-input" {...fp('marketed_by')} /></div>
                  <div><label className="form-label">Therapeutic Class</label><input className="form-input" {...fp('therapeutic_class')} /></div>
                </div>
              </div>
              <div><p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Flags</p>
                <div className="flex flex-wrap gap-4">
                  {([['is_generic','Generic'],['is_cold_chain','Cold Chain'],['is_narcotic','Narcotic'],['is_high_alert','High Alert'],['is_consignment','Consignment'],['scheduled_drug','Scheduled Drug']] as [keyof FormState, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form[key] as boolean} onChange={e => update(key, e.target.checked)} className="w-4 h-4 accent-teal-500" />{label}</label>
                  ))}
                </div>
              </div>
              <div><p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Classification</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="form-label">ABC (Value)</label><div className="flex gap-3">{['A','B','C'].map(v => (<label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm"><input type="radio" name="abc" value={v} checked={form.item_nature_abc === v} onChange={e => update('item_nature_abc', e.target.value)} className="accent-teal-500" />{v}</label>))}</div></div>
                  <div><label className="form-label">VED (Criticality)</label><div className="flex gap-3">{['V','E','D'].map(v => (<label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm"><input type="radio" name="ved" value={v} checked={form.item_nature_ved === v} onChange={e => update('item_nature_ved', e.target.value)} className="accent-teal-500" />{v}</label>))}</div></div>
                  <div><label className="form-label">FSN (Movement)</label><div className="flex gap-3">{['F','S','N'].map(v => (<label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm"><input type="radio" name="fsn" value={v} checked={form.item_nature_fsn === v} onChange={e => update('item_nature_fsn', e.target.value)} className="accent-teal-500" />{v}</label>))}</div></div>
                </div>
              </div>
              <div><p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Storage & Reorder</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className="form-label">Reorder Point</label><input type="number" className="form-input" {...fp('reorder_point')} /></div>
                  <div><label className="form-label">Safety Stock</label><input type="number" className="form-input" {...fp('safety_stock')} /></div>
                  <div><label className="form-label">Min Order Qty</label><input type="number" className="form-input" {...fp('min_order_qty')} /></div>
                  <div><label className="form-label">Lead Time (days)</label><input type="number" className="form-input" {...fp('lead_time_days')} /></div>
                  <div><label className="form-label">Shelf Life (days)</label><input type="number" className="form-input" {...fp('shelf_life_days')} /></div>
                  <div><label className="form-label">Storage Location</label><input className="form-input" {...fp('storage_location')} /></div>
                  <div><label className="form-label">Bin Location</label><input className="form-input" {...fp('bin_location')} /></div>
                </div>
              </div>
              <div><p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Integration</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="form-label">Tally Item Name</label><input className="form-input" {...fp('tally_item_name')} placeholder="Exact name in Tally" /></div>
                  <div><label className="form-label">Remarks</label><input className="form-input" {...fp('remarks')} /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex gap-3 pt-4 pb-8 border-t border-gray-200">
          <button type="submit" disabled={loading} className="btn-primary cursor-pointer">{loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Item</>}</button>
          <Link href="/items" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
