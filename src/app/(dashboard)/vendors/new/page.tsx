'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const STATES = [
  'Gujarat', 'Rajasthan', 'Maharashtra', 'Delhi', 'Karnataka',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Madhya Pradesh', 'Other'
]

const CREDIT_OPTIONS = [7, 15, 21, 30, 45, 60, 90]

export default function NewVendorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [selectedCentres, setSelectedCentres] = useState<string[]>([])

  const [form, setForm] = useState({
    legal_name: '',
    trade_name: '',
    category_id: '',
    gstin: '',
    pan: '',
    drug_license_no: '',
    primary_contact_name: '',
    primary_contact_phone: '',
    primary_contact_email: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pincode: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_account_type: 'current',
    credit_period_days: '30',
    payment_terms: '',
  })

  // Load categories and centres on mount
  useState(() => {
    const load = async () => {
      const [{ data: cats }, { data: cens }] = await Promise.all([
        supabase.from('vendor_categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('name'),
      ])
      if (cats) setCategories(cats)
      if (cens) {
        setCentres(cens)
        setSelectedCentres(cens.map((c: any) => c.id)) // default: all centres
      }
    }
    load()
  })

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleCentre(id: string) {
    setSelectedCentres(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.legal_name.trim()) {
      toast.error('Legal name is required')
      return
    }

    setLoading(true)

    // Use atomic DB sequence for race-safe numbering
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
      gstin: form.gstin.trim().toUpperCase() || null,
      pan: form.pan.trim().toUpperCase() || null,
      drug_license_no: form.drug_license_no.trim() || null,
      primary_contact_name: form.primary_contact_name.trim() || null,
      primary_contact_phone: form.primary_contact_phone.trim() || null,
      primary_contact_email: form.primary_contact_email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      pincode: form.pincode.trim() || null,
      bank_name: form.bank_name.trim() || null,
      bank_account_no: form.bank_account_no.trim() || null,
      bank_ifsc: form.bank_ifsc.trim().toUpperCase() || null,
      bank_account_type: form.bank_account_type || null,
      credit_period_days: parseInt(form.credit_period_days),
      payment_terms: form.payment_terms.trim() || null,
      approved_centres: selectedCentres.length > 0 ? selectedCentres : null,
      status: 'pending',
    }).select().single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(`Vendor ${vendor_code} created successfully`)
    router.push(`/vendors/${data.id}`)
  }

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <div>
          <Link href="/vendors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Vendors
          </Link>
          <h1 className="page-title">Add New Vendor</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Vendor</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Legal Name *</label>
              <input
                className="form-input"
                value={form.legal_name}
                onChange={e => update('legal_name', e.target.value)}
                placeholder="As per GST registration"
                required
              />
            </div>
            <div>
              <label className="form-label">Trade / Brand Name</label>
              <input
                className="form-input"
                value={form.trade_name}
                onChange={e => update('trade_name', e.target.value)}
                placeholder="Common name (if different)"
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={e => update('category_id', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Compliance & Registration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">GSTIN</label>
              <input
                className="form-input uppercase"
                value={form.gstin}
                onChange={e => update('gstin', e.target.value)}
                placeholder="15-character GST number"
                maxLength={15}
              />
            </div>
            <div>
              <label className="form-label">PAN</label>
              <input
                className="form-input uppercase"
                value={form.pan}
                onChange={e => update('pan', e.target.value)}
                placeholder="10-character PAN"
                maxLength={10}
              />
            </div>
            <div>
              <label className="form-label">Drug License No.</label>
              <input
                className="form-input"
                value={form.drug_license_no}
                onChange={e => update('drug_license_no', e.target.value)}
                placeholder="For pharma vendors"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Contact & Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.primary_contact_name} onChange={e => update('primary_contact_name', e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.primary_contact_phone} onChange={e => update('primary_contact_phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.primary_contact_email} onChange={e => update('primary_contact_email', e.target.value)} placeholder="vendor@company.com" />
            </div>
            <div className="md:col-span-3">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full address" />
            </div>
            <div>
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={e => update('city', e.target.value)} />
            </div>
            <div>
              <label className="form-label">State</label>
              <select className="form-select" value={form.state} onChange={e => update('state', e.target.value)}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Pincode</label>
              <input className="form-input" value={form.pincode} onChange={e => update('pincode', e.target.value)} maxLength={6} />
            </div>
          </div>
        </div>

        {/* Banking */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Banking Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Bank Name</label>
              <input className="form-input" value={form.bank_name} onChange={e => update('bank_name', e.target.value)} placeholder="e.g. HDFC Bank" />
            </div>
            <div>
              <label className="form-label">Account Type</label>
              <select className="form-select" value={form.bank_account_type} onChange={e => update('bank_account_type', e.target.value)}>
                <option value="current">Current</option>
                <option value="savings">Savings</option>
                <option value="cc">Cash Credit</option>
                <option value="od">Overdraft</option>
              </select>
            </div>
            <div>
              <label className="form-label">Account Number</label>
              <input className="form-input" value={form.bank_account_no} onChange={e => update('bank_account_no', e.target.value)} placeholder="Account number" />
            </div>
            <div>
              <label className="form-label">IFSC Code</label>
              <input className="form-input uppercase" value={form.bank_ifsc} onChange={e => update('bank_ifsc', e.target.value)} placeholder="HDFC0001234" maxLength={11} />
            </div>
          </div>
        </div>

        {/* Commercial */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Commercial Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Credit Period</label>
              <select className="form-select" value={form.credit_period_days} onChange={e => update('credit_period_days', e.target.value)}>
                {CREDIT_OPTIONS.map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Payment Terms</label>
              <input className="form-input" value={form.payment_terms} onChange={e => update('payment_terms', e.target.value)} placeholder="e.g. Net 30, advance 20%" />
            </div>
          </div>
        </div>

        {/* Approved Centres */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-2 pb-3 border-b border-gray-100">Approved Centres</h2>
          <p className="text-sm text-gray-500 mb-4">Select which centres this vendor can supply to.</p>
          <div className="flex flex-wrap gap-3">
            {centres.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCentre(c.id)}
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

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Vendor</>}
          </button>
          <Link href="/vendors" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
