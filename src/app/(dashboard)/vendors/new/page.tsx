'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal'
]
const CREDIT_OPTIONS = [7, 15, 21, 30, 45, 60, 90, 120]
const VENDOR_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'importer', label: 'Importer' },
  { value: 'service_provider', label: 'Service Provider' },
  { value: 'c_and_f', label: 'C&F Agent' },
]
const PAYMENT_MODES = [
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'imps', label: 'IMPS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'dd', label: 'DD' },
]
const TDS_SECTIONS = [
  { value: '194C', label: '194C — Contractors (1%/2%)' },
  { value: '194J', label: '194J — Professional fees (10%)' },
  { value: '194Q', label: '194Q — Purchase of goods (0.1%)' },
  { value: '194H', label: '194H — Commission (5%)' },
  { value: '194I', label: '194I — Rent (10%)' },
  { value: '194O', label: '194O — E-commerce (1%)' },
]

const TABS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'compliance', label: 'Compliance & KYC' },
  { id: 'contact', label: 'Contact & Address' },
  { id: 'banking', label: 'Banking' },
  { id: 'commercial', label: 'Commercial Terms' },
  { id: 'tds', label: 'TDS' },
  { id: 'centres', label: 'Centres & Integration' },
]

const defaultForm = {
  // Basic
  legal_name: '', trade_name: '', category_id: '', vendor_type: 'distributor',
  // Compliance
  gstin: '', pan: '', drug_license_no: '', fssai_no: '',
  drug_license_expiry: '', fssai_expiry: '',
  msme_registration_no: '', udyam_number: '', msme_category: '',
  gst_return_status: 'regular',
  // Primary contact
  primary_contact_name: '', primary_contact_phone: '', primary_contact_email: '',
  // Secondary contact
  secondary_contact_name: '', secondary_contact_phone: '',
  secondary_contact_email: '', secondary_contact_designation: '',
  // Address
  address: '', city: '', state: 'Gujarat', pincode: '',
  // Banking
  bank_name: '', bank_account_no: '', bank_ifsc: '', bank_account_type: 'current',
  // Commercial
  credit_period_days: '30', credit_limit: '', payment_terms: '',
  payment_mode_preferred: 'neft', minimum_order_value: '',
  trade_discount_percent: '0', cash_discount_percent: '0', cash_discount_days: '',
  delivery_terms: '',
  // TDS
  tds_applicable: false, tds_section: '', tds_rate: '',
  lower_tds_certificate: false, lower_tds_rate: '', lower_tds_valid_till: '',
  // Integration
  tally_ledger_name: '', tally_group: '',
}

type FormState = typeof defaultForm

export default function NewVendorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [selectedCentres, setSelectedCentres] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  function touch(field: string) {
    setTouched(prev => new Set(prev).add(field))
  }

  function validateField(field: keyof FormState, value: string): string | undefined {
    switch (field) {
      case 'legal_name':
        if (!value.trim()) return 'Legal name is required'
        if (value.trim().length < 3) return 'Legal name must be at least 3 characters'
        return undefined
      case 'gstin':
        if (value.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(value.trim()))
          return 'Invalid GSTIN format (e.g. 24AABCU9603R1ZM)'
        return undefined
      case 'pan':
        if (value.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(value.trim()))
          return 'Invalid PAN format (e.g. AABCU9603R)'
        return undefined
      case 'pincode':
        if (value.trim() && !/^[1-9][0-9]{5}$/.test(value.trim()))
          return 'Invalid pincode (must be 6 digits)'
        return undefined
      case 'primary_contact_email':
      case 'secondary_contact_email':
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Invalid email address'
        return undefined
      case 'primary_contact_phone':
      case 'secondary_contact_phone':
        if (value.trim() && !/^[\d+\-\s()]{10,15}$/.test(value.trim()))
          return 'Invalid phone number'
        return undefined
      case 'bank_ifsc':
        if (value.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(value.trim()))
          return 'Invalid IFSC code (e.g. SBIN0001234)'
        return undefined
      default:
        return undefined
    }
  }

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: cens }] = await Promise.all([
        supabase.from('vendor_categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('name'),
      ])
      if (cats) setCategories(cats)
      if (cens) {
        setCentres(cens)
        setSelectedCentres(cens.map((c: any) => c.id))
      }
    }
    load()
  }, [])

  function update(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (typeof value === 'string') {
      const err = validateField(field, value)
      setErrors(prev => {
        const next = { ...prev }
        if (err) next[field] = err
        else delete next[field]
        return next
      })
    }
  }

  function toggleCentre(id: string) {
    setSelectedCentres(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate all fields
    const fieldTabMap: Record<string, string> = {
      legal_name: 'basic', gstin: 'compliance', pan: 'compliance',
      pincode: 'contact', primary_contact_email: 'contact', primary_contact_phone: 'contact',
      secondary_contact_email: 'contact', secondary_contact_phone: 'contact',
      bank_ifsc: 'banking',
    }
    const newErrors: Partial<Record<keyof FormState, string>> = {}
    for (const field of Object.keys(fieldTabMap) as (keyof FormState)[]) {
      const err = validateField(field, form[field] as string)
      if (err) newErrors[field] = err
    }
    setErrors(newErrors)
    setTouched(new Set(Object.keys(fieldTabMap)))

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      const targetTab = fieldTabMap[firstErrorField]
      if (targetTab) setActiveTab(targetTab)
      toast.error('Please fix the highlighted errors')
      return
    }

    setLoading(true)

    let vendor_code: string
    try {
      const seqRes = await fetch('/api/sequence?type=vendor')
      const seqData = await seqRes.json()
      vendor_code = seqData.number
    } catch {
      const { count } = await supabase.from('vendors').select('*', { count: 'exact', head: true })
      vendor_code = `H1V-${String((count ?? 0) + 1).padStart(4, '0')}`
    }

    const { data, error } = await supabase.from('vendors').insert({
      vendor_code,
      legal_name: form.legal_name.trim(),
      trade_name: form.trade_name.trim() || null,
      category_id: form.category_id || null,
      vendor_type: form.vendor_type,
      // Compliance
      gstin: form.gstin.trim().toUpperCase() || null,
      pan: form.pan.trim().toUpperCase() || null,
      drug_license_no: form.drug_license_no.trim() || null,
      fssai_no: form.fssai_no.trim() || null,
      drug_license_expiry: form.drug_license_expiry || null,
      fssai_expiry: form.fssai_expiry || null,
      msme_registration_no: form.msme_registration_no.trim() || null,
      udyam_number: form.udyam_number.trim() || null,
      msme_category: form.msme_category || null,
      gst_return_status: form.gst_return_status || null,
      // Contact
      primary_contact_name: form.primary_contact_name.trim() || null,
      primary_contact_phone: form.primary_contact_phone.trim() || null,
      primary_contact_email: form.primary_contact_email.trim() || null,
      secondary_contact_name: form.secondary_contact_name.trim() || null,
      secondary_contact_phone: form.secondary_contact_phone.trim() || null,
      secondary_contact_email: form.secondary_contact_email.trim() || null,
      secondary_contact_designation: form.secondary_contact_designation.trim() || null,
      // Address
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      pincode: form.pincode.trim() || null,
      // Banking
      bank_name: form.bank_name.trim() || null,
      bank_account_no: form.bank_account_no.trim() || null,
      bank_ifsc: form.bank_ifsc.trim().toUpperCase() || null,
      bank_account_type: form.bank_account_type || null,
      // Commercial
      credit_period_days: parseInt(form.credit_period_days) || 30,
      credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      payment_terms: form.payment_terms.trim() || null,
      payment_mode_preferred: form.payment_mode_preferred || null,
      minimum_order_value: form.minimum_order_value ? parseFloat(form.minimum_order_value) : null,
      trade_discount_percent: parseFloat(form.trade_discount_percent) || 0,
      cash_discount_percent: parseFloat(form.cash_discount_percent) || 0,
      cash_discount_days: form.cash_discount_days ? parseInt(form.cash_discount_days) : null,
      delivery_terms: form.delivery_terms.trim() || null,
      // TDS
      tds_applicable: form.tds_applicable,
      tds_section: form.tds_applicable ? form.tds_section || null : null,
      tds_rate: form.tds_applicable && form.tds_rate ? parseFloat(form.tds_rate) : null,
      lower_tds_certificate: form.lower_tds_certificate,
      lower_tds_rate: form.lower_tds_certificate && form.lower_tds_rate ? parseFloat(form.lower_tds_rate) : null,
      lower_tds_valid_till: form.lower_tds_certificate ? form.lower_tds_valid_till || null : null,
      // Integration
      tally_ledger_name: form.tally_ledger_name.trim() || null,
      tally_group: form.tally_group.trim() || null,
      // Centres & status
      approved_centres: selectedCentres.length > 0 && selectedCentres.length < centres.length ? selectedCentres : null,
      status: 'pending',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success(`Vendor ${vendor_code} created`)
    router.push(`/vendors/${data.id}`)
  }

  return (
    <div className="max-w-6xl">
      <div className="page-header">
        <div>
          <Link href="/vendors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Vendors
          </Link>
          <h1 className="page-title">Add New Vendor</h1>
          <p className="page-subtitle">Complete vendor onboarding with compliance details</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Vendor</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto" role="tablist" aria-label="Vendor form sections">
        {TABS.map(tab => {
          const tabFieldMap: Record<string, string[]> = {
            basic: ['legal_name'],
            compliance: ['gstin', 'pan'],
            contact: ['primary_contact_phone', 'primary_contact_email', 'secondary_contact_email', 'secondary_contact_phone', 'pincode'],
            banking: ['bank_ifsc'],
          }
          const tabFields = tabFieldMap[tab.id] || []
          const hasError = tabFields.some(f => errors[f as keyof FormState])
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id ? 'border-[#0D7E8A] text-[#0D7E8A]' : hasError ? 'border-red-400 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {hasError && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} aria-label="Add new vendor form">
        {/* ═══ Basic Info ═══ */}
        {activeTab === 'basic' && (
          <div className="card p-6">
            <fieldset>
              <legend className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg w-[calc(100%+3rem)]">
                Vendor Identification
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label htmlFor="legal_name" className="form-label">Legal Name * <span className="text-gray-400 font-normal">(as per GST certificate)</span></label>
                  <input id="legal_name" className="form-input" value={form.legal_name} onChange={e => update('legal_name', e.target.value)} onBlur={() => touch('legal_name')} required aria-required="true" aria-invalid={touched.has('legal_name') && !!errors.legal_name} />
                  <FieldError message={errors.legal_name} show={touched.has('legal_name')} />
                </div>
                <div>
                  <label htmlFor="trade_name" className="form-label">Trade / Brand Name</label>
                  <input id="trade_name" className="form-input" value={form.trade_name} onChange={e => update('trade_name', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="category_id" className="form-label">Category</label>
                  <select id="category_id" className="form-select" value={form.category_id} onChange={e => update('category_id', e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="vendor_type" className="form-label">Vendor Type *</label>
                  <select id="vendor_type" className="form-select" value={form.vendor_type} onChange={e => update('vendor_type', e.target.value)} aria-required="true">
                    {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="vendor_code" className="form-label">Vendor Code</label>
                  <input id="vendor_code" className="form-input" disabled aria-disabled="true" value="Auto-generated (H1V-XXXX)" />
                </div>
              </div>
            </fieldset>
          </div>
        )}

        {/* ═══ Compliance & KYC ═══ */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="card p-6">
              <fieldset>
                <legend className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg w-[calc(100%+3rem)]">
                  Tax Registration
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label htmlFor="gstin" className="form-label">GSTIN</label>
                    <input id="gstin" className="form-input uppercase" value={form.gstin} onChange={e => update('gstin', e.target.value)} onBlur={() => touch('gstin')} maxLength={15} placeholder="24AABCU9603R1ZM" aria-describedby="gstin-hint" aria-invalid={touched.has('gstin') && !!errors.gstin} />
                    <span id="gstin-hint" className="sr-only">15-character GST Identification Number</span>
                    <FieldError message={errors.gstin} show={touched.has('gstin')} />
                  </div>
                  <div>
                    <label htmlFor="pan" className="form-label">PAN</label>
                    <input id="pan" className="form-input uppercase" value={form.pan} onChange={e => update('pan', e.target.value)} onBlur={() => touch('pan')} maxLength={10} placeholder="AABCU9603R" aria-describedby="pan-hint" aria-invalid={touched.has('pan') && !!errors.pan} />
                    <span id="pan-hint" className="sr-only">10-character Permanent Account Number</span>
                    <FieldError message={errors.pan} show={touched.has('pan')} />
                  </div>
                  <div>
                    <label htmlFor="gst_return_status" className="form-label">GST Filing Status</label>
                    <select id="gst_return_status" className="form-select" value={form.gst_return_status} onChange={e => update('gst_return_status', e.target.value)}>
                      <option value="regular">Regular Filer</option>
                      <option value="irregular">Irregular</option>
                      <option value="not_filed">Not Filed</option>
                      <option value="not_applicable">Not Applicable</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#E6F5F6] -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Licenses & Certificates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="form-label">Drug License No.</label>
                  <input className="form-input" value={form.drug_license_no} onChange={e => update('drug_license_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Drug License Expiry</label>
                  <input type="date" className="form-input" value={form.drug_license_expiry} onChange={e => update('drug_license_expiry', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">FSSAI No.</label>
                  <input className="form-input" value={form.fssai_no} onChange={e => update('fssai_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">FSSAI Expiry</label>
                  <input type="date" className="form-input" value={form.fssai_expiry} onChange={e => update('fssai_expiry', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">MSME Registration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">MSME Registration No.</label>
                  <input className="form-input" value={form.msme_registration_no} onChange={e => update('msme_registration_no', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Udyam Number</label>
                  <input className="form-input" value={form.udyam_number} onChange={e => update('udyam_number', e.target.value)} placeholder="UDYAM-XX-00-0000000" />
                </div>
                <div>
                  <label className="form-label">MSME Category</label>
                  <select className="form-select" value={form.msme_category} onChange={e => update('msme_category', e.target.value)}>
                    <option value="">Not Applicable</option>
                    <option value="micro">Micro</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Contact & Address ═══ */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="card p-6">
              <fieldset>
                <legend className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg w-[calc(100%+3rem)]">
                  Primary Contact
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div><label htmlFor="primary_contact_name" className="form-label">Name</label><input id="primary_contact_name" className="form-input" value={form.primary_contact_name} onChange={e => update('primary_contact_name', e.target.value)} /></div>
                  <div>
                    <label htmlFor="primary_contact_phone" className="form-label">Phone</label>
                    <input id="primary_contact_phone" className="form-input" value={form.primary_contact_phone} onChange={e => update('primary_contact_phone', e.target.value)} onBlur={() => touch('primary_contact_phone')} placeholder="+91 98765 43210" aria-invalid={touched.has('primary_contact_phone') && !!errors.primary_contact_phone} />
                    <FieldError message={errors.primary_contact_phone} show={touched.has('primary_contact_phone')} />
                  </div>
                  <div>
                    <label htmlFor="primary_contact_email" className="form-label">Email</label>
                    <input id="primary_contact_email" type="email" className="form-input" value={form.primary_contact_email} onChange={e => update('primary_contact_email', e.target.value)} onBlur={() => touch('primary_contact_email')} aria-invalid={touched.has('primary_contact_email') && !!errors.primary_contact_email} />
                    <FieldError message={errors.primary_contact_email} show={touched.has('primary_contact_email')} />
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Secondary Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="form-label">Name</label><input className="form-input" value={form.secondary_contact_name} onChange={e => update('secondary_contact_name', e.target.value)} /></div>
                <div><label className="form-label">Designation</label><input className="form-input" value={form.secondary_contact_designation} onChange={e => update('secondary_contact_designation', e.target.value)} /></div>
                <div><label className="form-label">Phone</label><input className="form-input" value={form.secondary_contact_phone} onChange={e => update('secondary_contact_phone', e.target.value)} /></div>
                <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.secondary_contact_email} onChange={e => update('secondary_contact_email', e.target.value)} /></div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Registered Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} /></div>
                <div><label className="form-label">City</label><input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} /></div>
                <div>
                  <label className="form-label">State</label>
                  <select className="form-select" value={form.state} onChange={e => update('state', e.target.value)}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Pincode</label>
                  <input className="form-input" value={form.pincode} onChange={e => update('pincode', e.target.value)} onBlur={() => touch('pincode')} maxLength={6} aria-invalid={touched.has('pincode') && !!errors.pincode} />
                  <FieldError message={errors.pincode} show={touched.has('pincode')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Banking ═══ */}
        {activeTab === 'banking' && (
          <div className="card p-6">
            <fieldset>
              <legend className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg w-[calc(100%+3rem)]">
                Banking Details
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div><label htmlFor="bank_name" className="form-label">Bank Name</label><input id="bank_name" className="form-input" value={form.bank_name} onChange={e => update('bank_name', e.target.value)} /></div>
                <div>
                  <label htmlFor="bank_account_type" className="form-label">Account Type</label>
                  <select id="bank_account_type" className="form-select" value={form.bank_account_type} onChange={e => update('bank_account_type', e.target.value)}>
                    <option value="current">Current</option>
                    <option value="savings">Savings</option>
                    <option value="cc">Cash Credit (CC)</option>
                    <option value="od">Overdraft (OD)</option>
                  </select>
                </div>
                <div><label htmlFor="bank_account_no" className="form-label">Account Number</label><input id="bank_account_no" className="form-input" value={form.bank_account_no} onChange={e => update('bank_account_no', e.target.value)} /></div>
                <div>
                  <label htmlFor="bank_ifsc" className="form-label">IFSC Code</label>
                  <input id="bank_ifsc" className="form-input uppercase" value={form.bank_ifsc} onChange={e => update('bank_ifsc', e.target.value)} onBlur={() => touch('bank_ifsc')} maxLength={11} aria-invalid={touched.has('bank_ifsc') && !!errors.bank_ifsc} />
                  <FieldError message={errors.bank_ifsc} show={touched.has('bank_ifsc')} />
                </div>
              </div>
            </fieldset>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
              Bank details will need verification via cancelled cheque before first payment release.
            </div>
          </div>
        )}

        {/* ═══ Commercial Terms ═══ */}
        {activeTab === 'commercial' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Payment & Credit Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="form-label">Credit Period</label>
                  <select className="form-select" value={form.credit_period_days} onChange={e => update('credit_period_days', e.target.value)}>
                    {CREDIT_OPTIONS.map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Credit Limit</label>
                  <input type="number" className="form-input" value={form.credit_limit} onChange={e => update('credit_limit', e.target.value)} min="0" step="1000" />
                </div>
                <div>
                  <label className="form-label">Preferred Payment Mode</label>
                  <select className="form-select" value={form.payment_mode_preferred} onChange={e => update('payment_mode_preferred', e.target.value)}>
                    {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Min Order Value</label>
                  <input type="number" className="form-input" value={form.minimum_order_value} onChange={e => update('minimum_order_value', e.target.value)} min="0" />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Payment Terms (text)</label>
                  <input className="form-input" value={form.payment_terms} onChange={e => update('payment_terms', e.target.value)} placeholder="e.g. Net 30 from GRN date, 20% advance for imports" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Discount Structure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Trade Discount %</label>
                  <input type="number" className="form-input" value={form.trade_discount_percent} onChange={e => update('trade_discount_percent', e.target.value)} step="0.01" min="0" max="100" />
                </div>
                <div>
                  <label className="form-label">Cash Discount %</label>
                  <input type="number" className="form-input" value={form.cash_discount_percent} onChange={e => update('cash_discount_percent', e.target.value)} step="0.01" min="0" max="100" />
                </div>
                <div>
                  <label className="form-label">Cash Disc. Valid Days</label>
                  <input type="number" className="form-input" value={form.cash_discount_days} onChange={e => update('cash_discount_days', e.target.value)} min="0" placeholder="e.g. 7 days" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Delivery Terms</h3>
              <textarea className="form-input" rows={3} value={form.delivery_terms} onChange={e => update('delivery_terms', e.target.value)}
                placeholder="Delivery terms, lead time expectations, damage/return policy..." />
            </div>
          </div>
        )}

        {/* ═══ TDS ═══ */}
        {activeTab === 'tds' && (
          <div className="card p-6">
            <h3 className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
              TDS (Tax Deducted at Source)
            </h3>
            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" checked={form.tds_applicable as boolean} onChange={e => update('tds_applicable', e.target.checked)}
                  className="w-4 h-4 accent-[#0D7E8A]" />
                <span className="text-sm font-medium">TDS Applicable for this vendor</span>
              </label>

              {form.tds_applicable && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">TDS Section</label>
                    <select className="form-select" value={form.tds_section} onChange={e => update('tds_section', e.target.value)}>
                      <option value="">Select section</option>
                      {TDS_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">TDS Rate (%)</label>
                    <input type="number" className="form-input" value={form.tds_rate} onChange={e => update('tds_rate', e.target.value)} step="0.01" min="0" max="30" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input type="checkbox" checked={form.lower_tds_certificate as boolean}
                        onChange={e => update('lower_tds_certificate', e.target.checked)} className="w-4 h-4 accent-[#0D7E8A]" />
                      <span className="text-sm">Lower TDS Certificate</span>
                    </label>
                  </div>
                  {form.lower_tds_certificate && (
                    <>
                      <div>
                        <label className="form-label">Lower TDS Rate (%)</label>
                        <input type="number" className="form-input" value={form.lower_tds_rate} onChange={e => update('lower_tds_rate', e.target.value)} step="0.01" />
                      </div>
                      <div>
                        <label className="form-label">Valid Till</label>
                        <input type="date" className="form-input" value={form.lower_tds_valid_till} onChange={e => update('lower_tds_valid_till', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Centres & Integration ═══ */}
        {activeTab === 'centres' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold text-[#1B3A6B] mb-2 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg">
                Approved Centres
              </h3>
              <p className="text-xs text-gray-500 mb-4 mt-2">Select which centres this vendor can supply to. All selected = group-wide vendor.</p>
              <div className="flex flex-wrap gap-3">
                {centres.map(c => (
                  <button key={c.id} type="button" onClick={() => toggleCentre(c.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedCentres.includes(c.id)
                        ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {c.code} — {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tally Integration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Tally Ledger Name</label>
                  <input className="form-input" value={form.tally_ledger_name} onChange={e => update('tally_ledger_name', e.target.value)}
                    placeholder="Exact ledger name in Tally" />
                  <p className="text-xs text-gray-400 mt-1">Must match exactly for payment sync</p>
                </div>
                <div>
                  <label className="form-label">Tally Group</label>
                  <input className="form-input" value={form.tally_group} onChange={e => update('tally_group', e.target.value)}
                    placeholder="e.g. Sundry Creditors" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save bar */}
        <div className="flex gap-3 pt-4 pb-8 mt-6 border-t flex-wrap">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Vendor</>}
          </button>
          <Link href="/vendors" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
