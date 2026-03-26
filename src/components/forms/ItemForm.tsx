'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Constants ────────────────────────────────────────────

const DEPARTMENTS = ['Medical', 'Surgical', 'Dental', 'Lab', 'Radiology', 'Dietary', 'Housekeeping', 'Engineering', 'IT', 'General']
const ITEM_TYPES = ['drug', 'consumable', 'surgical', 'implant', 'equipment', 'reagent', 'linen', 'stationery', 'food', 'other']
const ITEM_TYPE_LABELS: Record<string, string> = {
  drug: 'Drug', consumable: 'Consumable', surgical: 'Surgical', implant: 'Implant',
  equipment: 'Equipment', reagent: 'Reagent', linen: 'Linen', stationery: 'Stationery', food: 'Food', other: 'Other'
}

const UNITS = [
  'Tablet', 'Capsule', 'Vial', 'Ampoule', 'Bottle', 'Strip', 'Nos', 'Box', 'Pack',
  'Roll', 'Kg', 'Gm', 'Litre', 'ML', 'Pair', 'Set', 'Tube', 'Sachet', 'Bag',
  'Can', 'Drum', 'Ream', 'Cartridge', 'Piece'
]
const GST_SLABS = ['0', '5', '12', '18', '28']
const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Infusion', 'Cream',
  'Ointment', 'Gel', 'Drops', 'Inhaler', 'Nebulizer', 'Powder', 'Granules',
  'Suppository', 'Patch', 'Spray', 'Lotion', 'Solution', 'Emulsion', 'Other'
]
const ROA = [
  'Oral', 'IV', 'IM', 'SC', 'Topical', 'Sublingual', 'Rectal', 'Inhalation',
  'Nasal', 'Ophthalmic', 'Otic', 'Transdermal', 'Intrathecal', 'Epidural', 'Other'
]

const TABS = [
  { id: 'basic', label: 'Item Details', essential: true },
  { id: 'units', label: 'Unit Details', essential: false },
  { id: 'flags', label: 'Classification & Flags', essential: false },
  { id: 'pricing', label: 'Pricing & Tax', essential: true },
  { id: 'storage', label: 'Storage & Reorder', essential: false },
  { id: 'integration', label: 'Integration', essential: false },
]

// ─── Form State ───────────────────────────────────────────

const defaultForm = {
  // Basic
  generic_name: '', brand_name: '', category_id: '', department: 'Medical',
  item_type: 'drug', major_group: '', minor_group: '',
  snomed_ct_code: '', snomed_ct_description: '', ndc_code: '',
  // Drug details
  manufacturer: '', marketed_by: '', dosage_form: '', route_of_administration: '',
  specification: '', combination_of_drugs: '', strength: '', therapeutic_class: '',
  // Units
  unit: 'Nos', unit_levels: '1',
  level1_unit: '', level1_qty: '1',
  level2_unit: '', level2_qty: '',
  level3_unit: '', level3_qty: '',
  purchase_unit: '', receipt_unit: '', issue_unit: '', qty_conversion: '1',
  // ABC/VED/FSN
  item_nature_abc: '', item_nature_ved: '', item_nature_fsn: '',
  // Tax & Pricing
  hsn_code: '', gst_slab: '12', cgst_percent: '', sgst_percent: '', igst_percent: '',
  default_rate: '', mrp: '', muc_percent: '', margin_percent: '', ec_percent: '',
  ps_disc_percent: '0', mp_disc_percent: '100', grn_disc_percent: '0', freight: '0',
  is_non_disc: false,
  // Flags
  is_generic: false, is_cold_chain: false, is_narcotic: false, is_high_alert: false,
  is_hazardous: false, is_imported: false, is_rate_contract: false, is_pharma_approved: false,
  is_cssd_item: false, is_high_risk: false, is_stockable: true, is_consignment: false,
  is_capital_goods: false, is_refrigerated: false, is_linen: false, is_immunization: false,
  is_dpco: false, is_look_alike: false, is_sound_alike: false, is_gst_editable_in_grn: false,
  is_emergency_drug: false, is_kit: false, is_spare_parts: false, is_cpr_item: false,
  is_cp_item: false, allow_medicine_admin: false, allow_combination: false,
  scheduled_drug: false, scheduled_drug_category: '', free_period_hours: '',
  // Storage & Reorder
  shelf_life_days: '', storage_location: '', bin_location: '',
  reorder_point: '', safety_stock: '', min_order_qty: '', max_order_qty: '', lead_time_days: '',
  // Integration
  ecw_item_code: '', tally_item_name: '', remarks: '', notes: '',
}

type FormState = typeof defaultForm
type FormKey = keyof FormState

// ─── Component ────────────────────────────────────────────

export default function ItemForm({ mode = 'create', initialData }: { mode?: 'create' | 'edit'; initialData?: Record<string, any> }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; code: string; parent_id: string | null }[]>([])
  const [activeTab, setActiveTab] = useState('basic')
  const [showAllTabs, setShowAllTabs] = useState(false)
  const [form, setForm] = useState<FormState>({ ...defaultForm, ...initialData } as FormState)
  const [aliasNames, setAliasNames] = useState<string[]>([])
  const [newAlias, setNewAlias] = useState('')

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

  function update(field: FormKey, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function addAlias() {
    if (newAlias.trim() && !aliasNames.includes(newAlias.trim())) {
      setAliasNames(prev => [...prev, newAlias.trim()])
      setNewAlias('')
    }
  }

  // Auto-calculate CGST/SGST from GST slab
  useEffect(() => {
    const gst = parseFloat(form.gst_slab) || 0
    setForm(prev => ({
      ...prev,
      cgst_percent: String(gst / 2),
      sgst_percent: String(gst / 2),
      igst_percent: String(gst),
    }))
  }, [form.gst_slab])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.generic_name.trim()) { toast.error('Item Name is required'); return }

    // Margin lock: 10% minimum (except implants/consignment)
    const isExempt = form.is_consignment || form.item_type === 'implant' || form.department === 'OT'
    if (form.default_rate && form.mrp && parseFloat(form.mrp) > 0 && !isExempt) {
      const margin = (1 - parseFloat(form.default_rate) / parseFloat(form.mrp)) * 100
      if (margin < 10) {
        const proceed = window.confirm(
          `⚠️ MARGIN LOCK\n\nMargin is ${margin.toFixed(1)}% (minimum 10%).\nRate: ₹${form.default_rate} | MRP: ₹${form.mrp}\n\nThis item needs CAO approval to proceed. Continue?`
        )
        if (!proceed) return
      }
    }

    setLoading(true)
    try {
      // Generate code via sequence
      const { data: seqData } = await supabase.rpc('next_sequence_number', {
        seq_name: 'item_code_seq', seq_type: 'item', centre_code: 'XXX'
      })
      const item_code = seqData || `H1I-${String(Date.now()).slice(-5)}`

      const gstPercent = parseFloat(form.gst_slab) || 0

      const payload = {
        item_code,
        generic_name: form.generic_name.trim(),
        brand_name: form.brand_name.trim() || null,
        category_id: form.category_id || null,
        department: form.department,
        item_type: form.item_type || null,
        major_group: form.major_group.trim() || null,
        minor_group: form.minor_group.trim() || null,
        snomed_ct_code: form.snomed_ct_code.trim() || null,
        snomed_ct_description: form.snomed_ct_description.trim() || null,
        ndc_code: form.ndc_code.trim() || null,
        // Drug
        manufacturer: form.manufacturer.trim() || null,
        marketed_by: form.marketed_by.trim() || null,
        dosage_form: form.dosage_form || null,
        route_of_administration: form.route_of_administration || null,
        specification: form.specification.trim() || null,
        combination_of_drugs: form.combination_of_drugs.trim() || null,
        strength: form.strength.trim() || null,
        therapeutic_class: form.therapeutic_class.trim() || null,
        // Units
        unit: form.unit || form.level1_unit || 'Nos',
        unit_levels: parseInt(form.unit_levels) || 1,
        level1_unit: form.level1_unit || null,
        level1_qty_per_unit: parseFloat(form.level1_qty) || 1,
        level2_unit: form.level2_unit || null,
        level2_qty_per_unit: form.level2_qty ? parseFloat(form.level2_qty) : null,
        level3_unit: form.level3_unit || null,
        level3_qty_per_unit: form.level3_qty ? parseFloat(form.level3_qty) : null,
        purchase_unit: form.purchase_unit || null,
        receipt_unit: form.receipt_unit || null,
        issue_unit: form.issue_unit || null,
        qty_conversion: parseFloat(form.qty_conversion) || 1,
        // Classification
        item_nature_abc: form.item_nature_abc || null,
        item_nature_ved: form.item_nature_ved || null,
        item_nature_fsn: form.item_nature_fsn || null,
        // Tax
        hsn_code: form.hsn_code.trim() || null,
        gst_percent: gstPercent,
        gst_slab: form.gst_slab || null,
        cgst_percent: gstPercent / 2,
        sgst_percent: gstPercent / 2,
        igst_percent: gstPercent,
        // Pricing
        default_rate: form.default_rate ? parseFloat(form.default_rate) : null,
        mrp: form.mrp ? parseFloat(form.mrp) : null,
        muc_percent: form.muc_percent ? parseFloat(form.muc_percent) : null,
        margin_percent: form.margin_percent ? parseFloat(form.margin_percent) : null,
        ec_percent: form.ec_percent ? parseFloat(form.ec_percent) : null,
        ps_disc_percent: parseFloat(form.ps_disc_percent) || 0,
        mp_disc_percent: parseFloat(form.mp_disc_percent) || 100,
        grn_disc_percent: parseFloat(form.grn_disc_percent) || 0,
        is_non_disc: form.is_non_disc,
        freight: parseFloat(form.freight) || 0,
        // Flags
        is_generic: form.is_generic,
        is_cold_chain: form.is_cold_chain,
        is_narcotic: form.is_narcotic,
        is_high_alert: form.is_high_alert,
        is_hazardous: form.is_hazardous,
        is_imported: form.is_imported,
        is_rate_contract: form.is_rate_contract,
        is_pharma_approved: form.is_pharma_approved,
        is_cssd_item: form.is_cssd_item,
        is_high_risk: form.is_high_risk,
        is_stockable: form.is_stockable,
        is_consignment: form.is_consignment,
        is_capital_goods: form.is_capital_goods,
        is_refrigerated: form.is_refrigerated,
        is_linen: form.is_linen,
        is_immunization: form.is_immunization,
        is_dpco: form.is_dpco,
        is_look_alike: form.is_look_alike,
        is_sound_alike: form.is_sound_alike,
        is_gst_editable_in_grn: form.is_gst_editable_in_grn,
        is_emergency_drug: form.is_emergency_drug,
        is_kit: form.is_kit,
        is_spare_parts: form.is_spare_parts,
        is_cpr_item: form.is_cpr_item,
        is_cp_item: form.is_cp_item,
        allow_medicine_admin: form.allow_medicine_admin,
        allow_combination: form.allow_combination,
        scheduled_drug: form.scheduled_drug,
        scheduled_drug_category: form.scheduled_drug_category || null,
        free_period_hours: form.free_period_hours ? parseFloat(form.free_period_hours) : null,
        // Storage
        shelf_life_days: form.shelf_life_days ? parseInt(form.shelf_life_days) : null,
        storage_location: form.storage_location.trim() || null,
        bin_location: form.bin_location.trim() || null,
        reorder_point: form.reorder_point ? parseFloat(form.reorder_point) : null,
        safety_stock: form.safety_stock ? parseFloat(form.safety_stock) : null,
        min_order_qty: form.min_order_qty ? parseFloat(form.min_order_qty) : null,
        max_order_qty: form.max_order_qty ? parseFloat(form.max_order_qty) : null,
        lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
        // Integration
        ecw_item_code: form.ecw_item_code.trim() || null,
        tally_item_name: form.tally_item_name.trim() || null,
        alias_names: aliasNames.length > 0 ? aliasNames : null,
        remarks: form.remarks.trim() || null,
        notes: form.notes.trim() || null,
      }

      const { data, error } = await supabase.from('items').insert(payload).select().single()

      if (error) { toast.error(error.message); setLoading(false); return }
      toast.success(`Item ${item_code} created`)
      router.push(`/items/${data.id}`)
    } catch (err) {
      toast.error('Failed to create item')
      setLoading(false)
    }
  }

  const parentCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id)

  // All available units for unit hierarchy dropdowns
  const allUnits = [...UNITS]
  if (form.level1_unit && !allUnits.includes(form.level1_unit)) allUnits.push(form.level1_unit)
  if (form.level2_unit && !allUnits.includes(form.level2_unit)) allUnits.push(form.level2_unit)
  if (form.level3_unit && !allUnits.includes(form.level3_unit)) allUnits.push(form.level3_unit)

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Items
          </Link>
          <h1 className="page-title">Item Master — Add New</h1>
          <p className="page-subtitle">Complete item details matching hospital formulary standards</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Item</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto items-end">
        {TABS.filter(tab => showAllTabs || tab.essential).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-teal-500 text-teal-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button type="button" onClick={() => setShowAllTabs(!showAllTabs)}
          className="ml-auto px-3 py-2 text-xs text-gray-500 hover:text-teal-500 whitespace-nowrap border-b-2 border-transparent">
          {showAllTabs ? '← Essential only' : `+ ${TABS.filter(t => !t.essential).length} more tabs`}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ═══ TAB: Item Details ═══ */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Core identification */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Item Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="form-label">Item Name *</label>
                  <input className="form-input" value={form.generic_name} onChange={e => update('generic_name', e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg Capsule" required />
                </div>
                <div>
                  <label className="form-label">Item Code</label>
                  <input className="form-input" disabled value="Auto-generated" />
                </div>
                <div>
                  <label className="form-label">Department *</label>
                  <select className="form-select" value={form.department} onChange={e => update('department', e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Item Type</label>
                  <select className="form-select" value={form.item_type} onChange={e => update('item_type', e.target.value)}>
                    <option value="">Select</option>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>)}
                  </select>
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
              </div>
            </div>

            {/* Drug Details — shown only for drug/consumable */}
            {['drug', 'consumable'].includes(form.item_type) && (
              <div className="card p-6">
                <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-teal-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                  Drug / Item Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="form-label">Generic</label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" checked={form.is_generic} onChange={e => update('is_generic', e.target.checked)}
                          className="w-4 h-4 accent-teal-500" /> Generic
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Strength</label>
                    <input className="form-input" value={form.strength} onChange={e => update('strength', e.target.value)} placeholder="e.g. 500mg" />
                  </div>
                  <div>
                    <label className="form-label">Manufacturer *</label>
                    <input className="form-input" value={form.manufacturer} onChange={e => update('manufacturer', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Brand</label>
                    <input className="form-input" value={form.brand_name} onChange={e => update('brand_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Marketed By</label>
                    <input className="form-input" value={form.marketed_by} onChange={e => update('marketed_by', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Therapeutic Class</label>
                    <input className="form-input" value={form.therapeutic_class} onChange={e => update('therapeutic_class', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Dosage Form</label>
                    <select className="form-select" value={form.dosage_form} onChange={e => update('dosage_form', e.target.value)}>
                      <option value="">Select</option>
                      {DOSAGE_FORMS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">R.O.A.</label>
                    <select className="form-select" value={form.route_of_administration} onChange={e => update('route_of_administration', e.target.value)}>
                      <option value="">Select</option>
                      {ROA.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Specification</label>
                    <input className="form-input" value={form.specification} onChange={e => update('specification', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Combination of Drugs</label>
                    <input className="form-input" value={form.combination_of_drugs} onChange={e => update('combination_of_drugs', e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-4 mt-4 pt-3 border-t flex-wrap">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.allow_medicine_admin} onChange={e => update('allow_medicine_admin', e.target.checked)}
                      className="w-4 h-4 accent-teal-500" /> Allow for Medicine Administration
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.allow_combination} onChange={e => update('allow_combination', e.target.checked)}
                      className="w-4 h-4 accent-teal-500" /> Allow Combination of Drugs
                  </label>
                </div>
              </div>
            )}

            {/* Scheduled drug & free period */}
            {['drug', 'consumable'].includes(form.item_type) && (
              <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="checkbox" checked={form.scheduled_drug} onChange={e => update('scheduled_drug', e.target.checked)}
                        className="w-4 h-4 accent-teal-500" /> Scheduled Drug
                    </label>
                    {form.scheduled_drug && (
                      <select className="form-select mt-2" value={form.scheduled_drug_category} onChange={e => update('scheduled_drug_category', e.target.value)}>
                        <option value="">Category</option>
                        <option value="H">Schedule H</option>
                        <option value="H1">Schedule H1</option>
                        <option value="X">Schedule X</option>
                        <option value="G">Schedule G</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="form-label">24 hrs free/hrs</label>
                    <input type="number" className="form-input" value={form.free_period_hours}
                      onChange={e => update('free_period_hours', e.target.value)} step="0.5" />
                  </div>
                  <div>
                    <label className="form-label">Shelf Life (days)</label>
                    <input type="number" className="form-input" value={form.shelf_life_days}
                      onChange={e => update('shelf_life_days', e.target.value)} min="1" />
                  </div>
                  <div>
                    <label className="form-label">Remarks</label>
                    <input className="form-input" value={form.remarks} onChange={e => update('remarks', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Alias names */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Alias Names (for search)</h3>
              <div className="flex gap-2 mb-2">
                <input className="form-input flex-1" value={newAlias} onChange={e => setNewAlias(e.target.value)}
                  placeholder="Add alias name" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAlias() } }} />
                <button type="button" onClick={addAlias} className="btn-secondary"><Plus size={16} /></button>
              </div>
              {aliasNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aliasNames.map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-50 text-sm rounded-full">
                      {a}
                      <button type="button" onClick={() => setAliasNames(prev => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB: Unit Details ═══ */}
        {activeTab === 'units' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Unit of Measurement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="form-label">Unit *</label>
                  <select className="form-select" value={form.unit} onChange={e => { update('unit', e.target.value); update('level1_unit', e.target.value) }}>
                    <option value="">Select</option>
                    {allUnits.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Purchase Unit</label>
                  <select className="form-select" value={form.purchase_unit} onChange={e => update('purchase_unit', e.target.value)}>
                    <option value="">Same as Unit</option>
                    {allUnits.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Issue Unit</label>
                  <select className="form-select" value={form.issue_unit} onChange={e => update('issue_unit', e.target.value)}>
                    <option value="">Same as Unit</option>
                    {allUnits.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: Classification & Flags ═══ */}
        {activeTab === 'flags' && (
          <div className="space-y-6">
            {/* Item Nature */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Item Nature
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* ABC */}
                <div>
                  <label className="form-label">ABC Classification (Value)</label>
                  <div className="flex gap-4 mt-1">
                    {(['A', 'B', 'C'] as const).map(v => (
                      <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="abc" value={v} checked={form.item_nature_abc === v}
                          onChange={e => update('item_nature_abc', e.target.value)} className="accent-teal-500" />
                        <span className="text-sm font-medium">{v}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">A=High value, B=Medium, C=Low</p>
                </div>
                {/* VED */}
                <div>
                  <label className="form-label">VED Classification (Criticality)</label>
                  <div className="flex gap-4 mt-1">
                    {(['V', 'E', 'D'] as const).map(v => (
                      <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="ved" value={v} checked={form.item_nature_ved === v}
                          onChange={e => update('item_nature_ved', e.target.value)} className="accent-teal-500" />
                        <span className="text-sm font-medium">{v}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">V=Vital, E=Essential, D=Desirable</p>
                </div>
                {/* FSN */}
                <div>
                  <label className="form-label">FSN Classification (Movement)</label>
                  <div className="flex gap-4 mt-1">
                    {(['F', 'S', 'N'] as const).map(v => (
                      <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="fsn" value={v} checked={form.item_nature_fsn === v}
                          onChange={e => update('item_nature_fsn', e.target.value)} className="accent-teal-500" />
                        <span className="text-sm font-medium">{v}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">F=Fast-moving, S=Slow, N=Non-moving</p>
                </div>
              </div>
            </div>

            {/* All flags in grid */}
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Item Flags
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3 mt-4">
                {([
                  ['is_cssd_item', 'CSSD Item'],
                  ['is_high_risk', 'High Risk'],
                  ['is_stockable', 'Stockable'],
                  ['is_consignment', 'Consignment Item'],
                  ['is_dpco', 'DPCO'],
                  ['is_look_alike', 'Look A Like'],
                  ['is_sound_alike', 'Sound A Like'],
                  ['is_gst_editable_in_grn', 'GST Editable In GRN'],
                  ['is_emergency_drug', 'Emergency Drug'],
                  ['is_linen', 'Linen'],
                  ['is_immunization', 'Immunization'],
                  ['is_hazardous', 'Hazardous'],
                  ['is_narcotic', 'Narcotic'],
                  ['is_cold_chain', 'Cold Chain'],
                  ['is_refrigerated', 'Refrigerated'],
                  ['is_imported', 'Imported'],
                  ['is_rate_contract', 'Rate Contract'],
                  ['is_pharma_approved', 'Pharma Approved'],
                  ['is_capital_goods', 'Capital Goods'],
                  ['is_kit', 'Kit'],
                  ['is_spare_parts', 'Spare Parts'],
                  ['is_high_alert', 'High Alert'],
                  ['is_cpr_item', 'C.P.R. Item'],
                  ['is_cp_item', 'C.P. Item'],
                ] as [FormKey, string][]).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form[field] as boolean} onChange={e => update(field, e.target.checked)}
                      className="w-4 h-4 accent-teal-500 flex-shrink-0" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: Pricing & Tax ═══ */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Pricing & Margin
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="form-label">Purchase Rate (₹) *</label>
                  <input type="number" className="form-input" value={form.default_rate} onChange={e => update('default_rate', e.target.value)} step="0.01" min="0" placeholder="Vendor rate" />
                </div>
                <div>
                  <label className="form-label">MRP (₹) *</label>
                  <input type="number" className="form-input" value={form.mrp} onChange={e => update('mrp', e.target.value)} step="0.01" min="0" placeholder="Max retail price" />
                </div>
                <div>
                  <label className="form-label">Margin (%)</label>
                  <input type="number" className="form-input bg-gray-50" disabled
                    value={form.default_rate && form.mrp && parseFloat(form.mrp) > 0
                      ? ((1 - parseFloat(form.default_rate) / parseFloat(form.mrp)) * 100).toFixed(1)
                      : ''} />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm mt-6 cursor-pointer">
                    <input type="checkbox" checked={form.is_consignment || false} onChange={e => update('is_consignment', e.target.checked)}
                      className="w-4 h-4 accent-teal-500" /> Implant / Consignment (exempt from margin lock)
                  </label>
                </div>
              </div>
              {/* Margin validation */}
              {form.default_rate && form.mrp && parseFloat(form.mrp) > 0 && (() => {
                const rate = parseFloat(form.default_rate)
                const mrp = parseFloat(form.mrp)
                const margin = ((1 - rate / mrp) * 100)
                const isExempt = form.is_consignment || form.item_type === 'implant' || form.department === 'OT'
                if (margin < 10 && !isExempt) {
                  return (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <span className="text-red-600 text-sm font-semibold">⚠️ Margin {margin.toFixed(1)}% is below minimum 10%</span>
                      <span className="text-red-500 text-xs">Rate ₹{rate} on MRP ₹{mrp}. Increase MRP or negotiate lower rate.</span>
                    </div>
                  )
                }
                if (margin >= 10 && margin < 15) {
                  return <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">Margin {margin.toFixed(1)}% — acceptable but low. Target ≥15% for consumables.</div>
                }
                if (margin >= 15) {
                  return <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs">✓ Margin {margin.toFixed(1)}% — healthy</div>
                }
                return null
              })()}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="col-span-2">
                  <label className="form-label">HSN Code *</label>
                  <input className="form-input" value={form.hsn_code}
                    onChange={e => {
                      const hsn = e.target.value.trim()
                      const HSN_GST_MAP: Record<string, string> = {
                        '3001': '12', '3002': '12', '3003': '12', '3004': '12', '30041': '12', '30042': '12', '30049': '12', '30049099': '12',
                        '3005': '18', '3006': '18',
                        '9018': '12', '9019': '12', '9021': '12', '9022': '12',
                        '9402': '18', '4015': '12', '6307': '12', '8419': '18', '8713': '5', '9401': '18',
                      }
                      const match = HSN_GST_MAP[hsn] || HSN_GST_MAP[hsn.substring(0, 5)] || HSN_GST_MAP[hsn.substring(0, 4)]
                      // Batch both updates in single setForm to avoid stale closure
                      setForm((prev: any) => {
                        const gst = match ? parseFloat(match) : parseFloat(prev.gst_slab) || 12
                        return {
                          ...prev,
                          hsn_code: e.target.value,
                          ...(match ? { gst_slab: match, gst_percent: gst, cgst_percent: gst / 2, sgst_percent: gst / 2, igst_percent: gst } : {}),
                        }
                      })
                    }}
                    placeholder="e.g. 30049099" list="hsn-suggestions" />
                  <datalist id="hsn-suggestions">
                    <option value="30049099" label="Medicaments (drugs) — 12% GST" />
                    <option value="30042099" label="Antibiotics — 12% GST" />
                    <option value="30051090" label="Dressings — 18% GST" />
                    <option value="30061000" label="Surgical sutures — 18% GST" />
                    <option value="90183900" label="Needles, catheters, cannulae — 12% GST" />
                    <option value="90189099" label="Medical instruments — 12% GST" />
                    <option value="90211090" label="Ortho implants — 12% GST" />
                    <option value="90221490" label="X-ray equipment — 12% GST" />
                    <option value="90185090" label="Ophthalmic instruments — 12% GST" />
                    <option value="40151100" label="Surgical gloves — 12% GST" />
                    <option value="63079090" label="Surgical drapes — 12% GST" />
                    <option value="84198990" label="Sterilizers — 18% GST" />
                  </datalist>
                  {form.hsn_code && <p className="text-[10px] text-teal-600 mt-1">GST: {form.gst_slab}%</p>}
                </div>
                <div>
                  <label className="form-label">GST Slab *</label>
                  <select className="form-select" value={form.gst_slab} onChange={e => update('gst_slab', e.target.value)}>
                    {GST_SLABS.map(s => <option key={s} value={s}>{s}%</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Tax Breakdown (Auto-calculated)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="form-label">CGST %</label>
                  <input type="number" className="form-input bg-gray-50" value={form.cgst_percent} readOnly />
                </div>
                <div>
                  <label className="form-label">SGST %</label>
                  <input type="number" className="form-input bg-gray-50" value={form.sgst_percent} readOnly />
                </div>
                <div>
                  <label className="form-label">IGST %</label>
                  <input type="number" className="form-input bg-gray-50" value={form.igst_percent} readOnly />
                </div>
                <div>
                  <label className="form-label">GRN Disc%</label>
                  <input type="number" className="form-input" value={form.grn_disc_percent} onChange={e => update('grn_disc_percent', e.target.value)} step="0.01" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Discount Structure</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">P.S.Disc (%)</label>
                  <input type="number" className="form-input" value={form.ps_disc_percent} onChange={e => update('ps_disc_percent', e.target.value)} step="0.01" />
                </div>
                <div>
                  <label className="form-label">M.P.Disc (%)</label>
                  <input type="number" className="form-input" value={form.mp_disc_percent} onChange={e => update('mp_disc_percent', e.target.value)} step="0.01" />
                </div>
                <div>
                  <label className="form-label">Freight</label>
                  <input type="number" className="form-input" value={form.freight} onChange={e => update('freight', e.target.value)} step="0.01" min="0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: Storage & Reorder ═══ */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Storage & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="form-label">Storage Location</label>
                  <input className="form-input" value={form.storage_location} onChange={e => update('storage_location', e.target.value)} placeholder="e.g. Pharmacy Store A" />
                </div>
                <div>
                  <label className="form-label">Bin Location</label>
                  <input className="form-input" value={form.bin_location} onChange={e => update('bin_location', e.target.value)} placeholder="e.g. Rack 3, Shelf B" />
                </div>
                <div>
                  <label className="form-label">Shelf Life (days)</label>
                  <input type="number" className="form-input" value={form.shelf_life_days} onChange={e => update('shelf_life_days', e.target.value)} min="1" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Reorder Parameters
              </h3>
              <p className="text-xs text-gray-500 mb-4">These are default values. Centre-specific overrides are set in Stock Levels.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Reorder Point</label>
                  <input type="number" className="form-input" value={form.reorder_point} onChange={e => update('reorder_point', e.target.value)} min="0" />
                </div>
                <div>
                  <label className="form-label">Safety Stock</label>
                  <input type="number" className="form-input" value={form.safety_stock} onChange={e => update('safety_stock', e.target.value)} min="0" />
                </div>
                <div>
                  <label className="form-label">Min Order Qty</label>
                  <input type="number" className="form-input" value={form.min_order_qty} onChange={e => update('min_order_qty', e.target.value)} min="0" />
                </div>
                <div>
                  <label className="form-label">Max Order Qty</label>
                  <input type="number" className="form-input" value={form.max_order_qty} onChange={e => update('max_order_qty', e.target.value)} min="0" />
                </div>
                <div>
                  <label className="form-label">Lead Time (days)</label>
                  <input type="number" className="form-input" value={form.lead_time_days} onChange={e => update('lead_time_days', e.target.value)} min="0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: Integration ═══ */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-navy-600 mb-4 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                System Integration Mapping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="form-label">eClinicalWorks Item Code</label>
                  <input className="form-input" value={form.ecw_item_code} onChange={e => update('ecw_item_code', e.target.value)}
                    placeholder="eCW item code for consumption sync" />
                  <p className="text-xs text-gray-500 mt-1">Maps this item to eCW for consumption data import</p>
                </div>
                <div>
                  <label className="form-label">Tally Item Name</label>
                  <input className="form-input" value={form.tally_item_name} onChange={e => update('tally_item_name', e.target.value)}
                    placeholder="Exact name in Tally stock item" />
                  <p className="text-xs text-gray-500 mt-1">Must match the exact Stock Item name in Tally for sync</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
              <textarea className="form-input" rows={4} value={form.notes} onChange={e => update('notes', e.target.value)}
                placeholder="Internal notes about this item..." />
            </div>
          </div>
        )}

        {/* Save bar */}
        <div className="flex gap-3 flex-wrap pt-4 pb-8 mt-6 border-t">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Item</>}
          </button>
          <Link href="/items" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
