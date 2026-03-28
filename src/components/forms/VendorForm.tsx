'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal']
const CREDIT_OPTIONS = [7, 15, 21, 30, 45, 60, 90, 120]
const VENDOR_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer' },{ value: 'distributor', label: 'Distributor' },
  { value: 'dealer', label: 'Dealer' },{ value: 'importer', label: 'Importer' },
  { value: 'service_provider', label: 'Service Provider' },{ value: 'c_and_f', label: 'C&F Agent' },
]
const PAYMENT_MODES = [
  { value: 'neft', label: 'NEFT' },{ value: 'rtgs', label: 'RTGS' },{ value: 'imps', label: 'IMPS' },
  { value: 'cheque', label: 'Cheque' },{ value: 'upi', label: 'UPI' },{ value: 'dd', label: 'DD' },
]
const TDS_SECTIONS = [
  { value: '194C', label: '194C — Contractors (1%/2%)' },{ value: '194J', label: '194J — Professional fees (10%)' },
  { value: '194Q', label: '194Q — Purchase of goods (0.1%)' },{ value: '194H', label: '194H — Commission (5%)' },
  { value: '194I', label: '194I — Rent (10%)' },{ value: '194O', label: '194O — E-commerce (1%)' },
]

const defaultForm = {
  legal_name: '', trade_name: '', category_id: '', vendor_type: 'distributor',
  gstin: '', pan: '', drug_license_no: '', fssai_no: '', drug_license_expiry: '', fssai_expiry: '',
  msme_registration_no: '', udyam_number: '', msme_category: '', gst_return_status: 'regular',
  primary_contact_name: '', primary_contact_phone: '', primary_contact_email: '',
  secondary_contact_name: '', secondary_contact_phone: '', secondary_contact_email: '', secondary_contact_designation: '',
  address: '', city: '', state: 'Gujarat', pincode: '',
  bank_name: '', bank_account_no: '', bank_ifsc: '', bank_account_type: 'current',
  credit_period_days: '30', credit_limit: '', payment_terms: '', payment_mode_preferred: 'neft',
  minimum_order_value: '', trade_discount_percent: '0', cash_discount_percent: '0', cash_discount_days: '',
  delivery_terms: '',
  tds_applicable: false, tds_section: '', tds_rate: '',
  lower_tds_certificate: false, lower_tds_rate: '', lower_tds_valid_till: '',
  tally_ledger_name: '', tally_group: '',
}
type FormState = typeof defaultForm

export default function VendorForm({ mode = 'create', initialData }: { mode?: 'create' | 'edit'; initialData?: Partial<FormState> }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [quickMode, setQuickMode] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [selectedCentres, setSelectedCentres] = useState<string[]>([])
  const [form, setForm] = useState<FormState>({ ...defaultForm, ...initialData })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  function touch(field: string) { setTouched(prev => new Set(prev).add(field)) }

  // Red asterisk for mandatory fields
  function Req() { return <span className="text-red-500 font-bold ml-0.5">*</span> }

  // Error class for field wrappers
  function errCls(field: keyof FormState) {
    return touched.has(field) && errors[field] ? 'bg-red-50 rounded-lg p-2 ring-1 ring-red-300' : ''
  }

  function validateField(field: keyof FormState, value: string): string | undefined {
    switch (field) {
      case 'legal_name': if (!value.trim()) return 'Legal name is required'; if (value.trim().length < 3) return 'At least 3 characters'; return undefined
      case 'gstin': if (!value.trim()) return 'GST number is mandatory'; if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(value.trim())) return 'Invalid GSTIN format'; return undefined
      case 'pan': if (!value.trim()) return 'PAN is mandatory'; if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value.trim())) return 'Invalid PAN format'; return undefined
      case 'primary_contact_name': if (!value.trim()) return 'Contact name is mandatory'; return undefined
      case 'primary_contact_phone': if (!value.trim()) return 'Contact phone is mandatory'; if (!/^[\d+\-\s()]{10,15}$/.test(value.trim())) return 'Invalid phone number'; return undefined
      case 'primary_contact_email': if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Invalid email'; return undefined
      case 'bank_name': if (!value.trim()) return 'Bank name is mandatory'; return undefined
      case 'bank_account_no': if (!value.trim()) return 'Account number is mandatory'; return undefined
      case 'bank_ifsc': if (!value.trim()) return 'IFSC code is mandatory'; if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(value.trim())) return 'Invalid IFSC'; return undefined
      case 'pincode': if (value.trim() && !/^[1-9][0-9]{5}$/.test(value.trim())) return 'Invalid pincode'; return undefined
      default: return undefined
    }
  }

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: cens }] = await Promise.all([
        supabase.from('vendor_categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('name'),
      ])
      if (cats && cats.length > 0) {
        setCategories(cats)
      } else {
        // Fallback: load all categories if none are active
        const { data: allCats } = await supabase.from('vendor_categories').select('id, name').order('name')
        if (allCats) setCategories(allCats)
      }
      if (cens) { setCentres(cens); setSelectedCentres(cens.map((c: any) => c.id)) }
    }
    load()
  }, [])

  function update(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (typeof value === 'string') {
      const err = validateField(field, value)
      setErrors(prev => { const next = { ...prev }; if (err) next[field] = err; else delete next[field]; return next })
    }
  }

  function toggleCentre(id: string) { setSelectedCentres(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]) }

  function fp(field: keyof FormState) {
    return {
      id: field, value: form[field] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(field, e.target.value),
      onBlur: () => touch(field),
      'aria-invalid': touched.has(field) && !!errors[field],
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const mandatory: (keyof FormState)[] = quickMode
      ? ['legal_name', 'primary_contact_phone']
      : ['legal_name', 'gstin', 'pan', 'primary_contact_name', 'primary_contact_phone', 'bank_name', 'bank_account_no', 'bank_ifsc']
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    for (const field of mandatory) { const err = validateField(field, form[field] as string); if (err) newErrors[field] = err }
    setErrors(newErrors)
    setTouched(new Set(mandatory.map(String)))
    if (Object.keys(newErrors).length > 0) {
      // List the missing fields in the toast
      const fieldLabels: Record<string, string> = {
        legal_name: 'Legal Name', gstin: 'GSTIN', pan: 'PAN',
        primary_contact_name: 'Contact Name', primary_contact_phone: 'Contact Phone',
        bank_name: 'Bank Name', bank_account_no: 'Account Number', bank_ifsc: 'IFSC Code',
      }
      const missing = Object.keys(newErrors).map(f => fieldLabels[f] || f).join(', ')
      toast.error(`Missing: ${missing}`, { duration: 6000 })
      // Scroll to first error after DOM update
      setTimeout(() => {
        const el = document.getElementById(Object.keys(newErrors)[0])
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus() }
      }, 100)
      return
    }
    setLoading(true)
    if (form.gstin.trim()) {
      const { data: dup } = await supabase.from('vendors').select('id, vendor_code, legal_name').eq('gstin', form.gstin.trim().toUpperCase()).is('deleted_at', null).limit(1)
      if (dup && dup.length > 0) { toast.error(`GSTIN already registered to ${dup[0].vendor_code} — ${dup[0].legal_name}`); setLoading(false); return }
    }
    if (form.pan.trim()) {
      const { data: dup } = await supabase.from('vendors').select('id, vendor_code, legal_name').eq('pan', form.pan.trim().toUpperCase()).is('deleted_at', null).limit(1)
      if (dup && dup.length > 0) { toast.error(`PAN already registered to ${dup[0].vendor_code} — ${dup[0].legal_name}`); setLoading(false); return }
    }
    let vendor_code: string
    try {
      const r = await fetch('/api/sequence?type=vendor'); const d = await r.json()
      if (!r.ok || !d.number) throw new Error(); vendor_code = d.number
    } catch { const { count } = await supabase.from('vendors').select('*', { count: 'exact', head: true }); vendor_code = `H1V-${String((count ?? 0) + 1).padStart(4, '0')}` }

    const { data, error } = await supabase.from('vendors').insert({
      vendor_code, legal_name: form.legal_name.trim(), trade_name: form.trade_name.trim() || null,
      category_id: form.category_id || null, vendor_type: form.vendor_type,
      gstin: form.gstin.trim().toUpperCase() || null, pan: form.pan.trim().toUpperCase() || null,
      drug_license_no: form.drug_license_no.trim() || null, fssai_no: form.fssai_no.trim() || null,
      drug_license_expiry: form.drug_license_expiry || null, fssai_expiry: form.fssai_expiry || null,
      msme_registration_no: form.msme_registration_no.trim() || null, udyam_number: form.udyam_number.trim() || null,
      msme_category: form.msme_category || null, gst_return_status: form.gst_return_status || null,
      primary_contact_name: form.primary_contact_name.trim() || null, primary_contact_phone: form.primary_contact_phone.trim() || null,
      primary_contact_email: form.primary_contact_email.trim() || null,
      secondary_contact_name: form.secondary_contact_name.trim() || null, secondary_contact_phone: form.secondary_contact_phone.trim() || null,
      secondary_contact_email: form.secondary_contact_email.trim() || null, secondary_contact_designation: form.secondary_contact_designation.trim() || null,
      address: form.address.trim() || null, city: form.city.trim() || null, state: form.state || null, pincode: form.pincode.trim() || null,
      bank_name: form.bank_name.trim() || null, bank_account_no: form.bank_account_no.trim() || null,
      bank_ifsc: form.bank_ifsc.trim().toUpperCase() || null, bank_account_type: form.bank_account_type || null,
      credit_period_days: parseInt(form.credit_period_days) || 30, credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      payment_terms: form.payment_terms.trim() || null, payment_mode_preferred: form.payment_mode_preferred || null,
      minimum_order_value: form.minimum_order_value ? parseFloat(form.minimum_order_value) : null,
      trade_discount_percent: parseFloat(form.trade_discount_percent) || 0, cash_discount_percent: parseFloat(form.cash_discount_percent) || 0,
      cash_discount_days: form.cash_discount_days ? parseInt(form.cash_discount_days) : null, delivery_terms: form.delivery_terms.trim() || null,
      tds_applicable: form.tds_applicable, tds_section: form.tds_applicable ? form.tds_section || null : null,
      tds_rate: form.tds_applicable && form.tds_rate ? parseFloat(form.tds_rate) : null,
      lower_tds_certificate: form.lower_tds_certificate,
      lower_tds_rate: form.lower_tds_certificate && form.lower_tds_rate ? parseFloat(form.lower_tds_rate) : null,
      lower_tds_valid_till: form.lower_tds_certificate ? form.lower_tds_valid_till || null : null,
      tally_ledger_name: form.tally_ledger_name.trim() || null, tally_group: form.tally_group.trim() || null,
      approved_centres: selectedCentres.length > 0 && selectedCentres.length < centres.length ? selectedCentres : null,
      status: 'pending', onboarding_status: quickMode ? 'quick_draft' : 'complete',
    }).select().single()
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success(quickMode ? `Vendor ${vendor_code} quick-added` : `Vendor ${vendor_code} created`)
    router.push(`/vendors/${data.id}`)
  }

  function SH({ n, t }: { n: number; t: string }) {
    return <div className="font-semibold text-navy-600 pb-2 border-b bg-navy-50 -mx-6 -mt-6 px-6 py-3 rounded-t-lg">{n}. {t}</div>
  }

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href="/vendors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"><ArrowLeft size={14} /> Back to Vendors</Link>
          <h1 className="page-title">Add New Vendor</h1>
          <p className="page-subtitle">{quickMode ? 'Quick add — name + phone only' : 'Full vendor onboarding'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-sm">
            <button type="button" onClick={() => setQuickMode(false)} className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${!quickMode ? 'bg-white shadow text-navy-600' : 'text-gray-500'}`}>Full</button>
            <button type="button" onClick={() => setQuickMode(true)} className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${quickMode ? 'bg-white shadow text-teal-500' : 'text-gray-500'}`}>Quick Add</button>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary cursor-pointer">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Vendor</>}
          </button>
        </div>
      </div>

      {quickMode ? (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Legal Name *</label><input className="form-input" {...fp('legal_name')} autoFocus /><FieldError message={errors.legal_name} show={touched.has('legal_name')} /></div>
            <div><label className="form-label">Trade Name</label><input className="form-input" {...fp('trade_name')} /></div>
            <div><label className="form-label">Contact Phone *</label><input className="form-input" {...fp('primary_contact_phone')} placeholder="Mobile" /><FieldError message={errors.primary_contact_phone} show={touched.has('primary_contact_phone')} /></div>
            <div><label className="form-label">Contact Name</label><input className="form-input" {...fp('primary_contact_name')} /></div>
            <div><label className="form-label">GSTIN (optional)</label><input className="form-input font-mono uppercase" {...fp('gstin')} maxLength={15} /></div>
            <div><label className="form-label">City</label><input className="form-input" {...fp('city')} /></div>
          </div>
          <div className="pt-4 border-t text-sm text-amber-700 bg-amber-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">Quick-added vendors need full onboarding before PO creation.</div>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic */}
        <div className="card p-6"><SH n={1} t="Vendor Identification" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className={`md:col-span-2 ${errCls('legal_name')}`}><label className="form-label">Legal Name<Req /> <span className="text-gray-500 font-normal">(as per GST certificate)</span></label><input className="form-input" {...fp('legal_name')} required autoFocus /><FieldError message={errors.legal_name} show={touched.has('legal_name')} /></div>
            <div><label className="form-label">Trade / Brand Name</label><input className="form-input" {...fp('trade_name')} /></div>
            <div><label className="form-label">Category</label><select className="form-select" value={form.category_id} onChange={e => update('category_id', e.target.value)}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="form-label">Vendor Type<Req /></label><select className="form-select" value={form.vendor_type} onChange={e => update('vendor_type', e.target.value)}>{VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="form-label">Vendor Code</label><input className="form-input" disabled value="Auto-generated (H1V-XXXX)" /></div>
          </div>
        </div>

        {/* 2. Tax & KYC */}
        <div className="card p-6"><SH n={2} t="Tax Registration & KYC" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={errCls('gstin')}><label className="form-label">GSTIN<Req /></label><input className="form-input uppercase" {...fp('gstin')} maxLength={15} placeholder="24AABCU9603R1ZM" /><FieldError message={errors.gstin} show={touched.has('gstin')} /></div>
            <div className={errCls('pan')}><label className="form-label">PAN<Req /></label><input className="form-input uppercase" {...fp('pan')} maxLength={10} placeholder="AABCU9603R" /><FieldError message={errors.pan} show={touched.has('pan')} /></div>
            <div><label className="form-label">GST Filing Status</label><select className="form-select" value={form.gst_return_status} onChange={e => update('gst_return_status', e.target.value)}><option value="regular">Regular</option><option value="irregular">Irregular</option><option value="defaulter">Defaulter</option></select></div>
            <div><label className="form-label">Drug License No.</label><input className="form-input" {...fp('drug_license_no')} /></div>
            <div><label className="form-label">FSSAI No.</label><input className="form-input" {...fp('fssai_no')} /></div>
            <div><label className="form-label">MSME Category</label><select className="form-select" value={form.msme_category} onChange={e => update('msme_category', e.target.value)}><option value="">N/A</option><option value="micro">Micro</option><option value="small">Small</option><option value="medium">Medium</option></select></div>
            <div><label className="form-label">MSME Reg. No.</label><input className="form-input" {...fp('msme_registration_no')} /></div>
            <div><label className="form-label">Udyam Number</label><input className="form-input" {...fp('udyam_number')} placeholder="UDYAM-XX-00-0000000" /></div>
          </div>
        </div>

        {/* 3. Contact & Address */}
        <div className="card p-6"><SH n={3} t="Contact & Address" />
          <p className="text-xs text-gray-500 mb-3 mt-4 font-medium uppercase tracking-wider">Primary Contact</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={errCls('primary_contact_name')}><label className="form-label">Name<Req /></label><input className="form-input" {...fp('primary_contact_name')} /><FieldError message={errors.primary_contact_name} show={touched.has('primary_contact_name')} /></div>
            <div className={errCls('primary_contact_phone')}><label className="form-label">Phone<Req /></label><input className="form-input" {...fp('primary_contact_phone')} placeholder="+91 98765 43210" /><FieldError message={errors.primary_contact_phone} show={touched.has('primary_contact_phone')} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" {...fp('primary_contact_email')} /><FieldError message={errors.primary_contact_email} show={touched.has('primary_contact_email')} /></div>
          </div>
          <p className="text-xs text-gray-500 mb-3 mt-6 font-medium uppercase tracking-wider">Secondary Contact (optional)</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="form-label">Name</label><input className="form-input" {...fp('secondary_contact_name')} /></div>
            <div><label className="form-label">Designation</label><input className="form-input" {...fp('secondary_contact_designation')} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" {...fp('secondary_contact_phone')} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" {...fp('secondary_contact_email')} /></div>
          </div>
          <p className="text-xs text-gray-500 mb-3 mt-6 font-medium uppercase tracking-wider">Registered Address</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3"><label className="form-label">Address</label><input className="form-input" {...fp('address')} /></div>
            <div><label className="form-label">City</label><input className="form-input" {...fp('city')} /></div>
            <div><label className="form-label">State</label><select className="form-select" value={form.state} onChange={e => update('state', e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="form-label">Pincode</label><input className="form-input" {...fp('pincode')} maxLength={6} /><FieldError message={errors.pincode} show={touched.has('pincode')} /></div>
          </div>
        </div>

        {/* 4. Banking */}
        <div className="card p-6"><SH n={4} t="Banking Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className={errCls('bank_name')}><label className="form-label">Bank Name<Req /></label><input className="form-input" {...fp('bank_name')} /><FieldError message={errors.bank_name} show={touched.has('bank_name')} /></div>
            <div><label className="form-label">Account Type</label><select className="form-select" value={form.bank_account_type} onChange={e => update('bank_account_type', e.target.value)}><option value="current">Current</option><option value="savings">Savings</option><option value="cc">Cash Credit</option><option value="od">Overdraft</option></select></div>
            <div className={errCls('bank_account_no')}><label className="form-label">Account Number<Req /></label><input className="form-input" {...fp('bank_account_no')} /><FieldError message={errors.bank_account_no} show={touched.has('bank_account_no')} /></div>
            <div className={errCls('bank_ifsc')}><label className="form-label">IFSC Code<Req /></label><input className="form-input uppercase" {...fp('bank_ifsc')} maxLength={11} /><FieldError message={errors.bank_ifsc} show={touched.has('bank_ifsc')} /></div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">Bank details need verification via cancelled cheque before first payment.</div>
        </div>

        {/* 5. Commercial */}
        <div className="card p-6"><SH n={5} t="Commercial Terms" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div><label className="form-label">Credit Period</label><select className="form-select" value={form.credit_period_days} onChange={e => update('credit_period_days', e.target.value)}>{CREDIT_OPTIONS.map(d => <option key={d} value={d}>{d} days</option>)}</select></div>
            <div><label className="form-label">Credit Limit (₹)</label><input type="number" className="form-input" {...fp('credit_limit')} placeholder="No limit" /></div>
            <div><label className="form-label">Payment Mode</label><select className="form-select" value={form.payment_mode_preferred} onChange={e => update('payment_mode_preferred', e.target.value)}>{PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
            <div><label className="form-label">Min. Order (₹)</label><input type="number" className="form-input" {...fp('minimum_order_value')} placeholder="No min" /></div>
            <div className="md:col-span-2"><label className="form-label">Payment Terms</label><input className="form-input" {...fp('payment_terms')} placeholder="e.g. 30 days from invoice" /></div>
          </div>
          <p className="text-xs text-gray-500 mb-3 mt-5 font-medium uppercase tracking-wider">Discounts</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="form-label">Trade Discount %</label><input type="number" className="form-input" {...fp('trade_discount_percent')} step="0.01" min="0" max="100" /></div>
            <div><label className="form-label">Cash Discount %</label><input type="number" className="form-input" {...fp('cash_discount_percent')} step="0.01" min="0" max="100" /></div>
            <div><label className="form-label">Cash Disc. Days</label><input type="number" className="form-input" {...fp('cash_discount_days')} min="0" placeholder="e.g. 7" /></div>
          </div>
          <div className="mt-4"><label className="form-label">Delivery Terms</label><textarea className="form-input" rows={2} value={form.delivery_terms} onChange={e => update('delivery_terms', e.target.value)} placeholder="Lead time, return policy..." /></div>
        </div>

        {/* 6. TDS */}
        <div className="card p-6"><SH n={6} t="TDS" />
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-4"><input type="checkbox" checked={form.tds_applicable as boolean} onChange={e => update('tds_applicable', e.target.checked)} className="w-4 h-4 accent-teal-500" /><span className="text-sm font-medium">TDS Applicable</span></label>
            {form.tds_applicable && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="form-label">Section</label><select className="form-select" value={form.tds_section} onChange={e => update('tds_section', e.target.value)}><option value="">Select</option>{TDS_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className="form-label">Rate (%)</label><input type="number" className="form-input" {...fp('tds_rate')} step="0.01" min="0" max="30" /></div>
                <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer pb-2"><input type="checkbox" checked={form.lower_tds_certificate as boolean} onChange={e => update('lower_tds_certificate', e.target.checked)} className="w-4 h-4 accent-teal-500" /><span className="text-sm">Lower TDS Cert</span></label></div>
                {form.lower_tds_certificate && (<><div><label className="form-label">Lower Rate (%)</label><input type="number" className="form-input" {...fp('lower_tds_rate')} step="0.01" /></div><div><label className="form-label">Valid Till</label><input type="date" className="form-input" {...fp('lower_tds_valid_till')} /></div></>)}
              </div>
            )}
          </div>
        </div>

        {/* 7. Centres & Tally */}
        <div className="card p-6"><SH n={7} t="Centres & Tally" />
          <p className="text-xs text-gray-500 mb-4 mt-4">Select supply centres. All selected = group-wide.</p>
          <div className="flex flex-wrap gap-3 mb-6">
            {centres.map(c => (<button key={c.id} type="button" onClick={() => toggleCentre(c.id)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${selectedCentres.includes(c.id) ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{c.code} — {c.name}</button>))}
          </div>
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Tally</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Ledger Name</label><input className="form-input" {...fp('tally_ledger_name')} placeholder="Exact name in Tally" /><p className="text-xs text-gray-500 mt-1">Must match for payment sync</p></div>
            <div><label className="form-label">Group</label><input className="form-input" {...fp('tally_group')} placeholder="e.g. Sundry Creditors" /></div>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3 pt-4 pb-8 mt-6 border-t border-gray-200">
          <button type="submit" disabled={loading} className="btn-primary cursor-pointer">{loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Vendor</>}</button>
          <Link href="/vendors" className="btn-secondary">Cancel</Link>
        </div>
      </form>
      )}
    </div>
  )
}
