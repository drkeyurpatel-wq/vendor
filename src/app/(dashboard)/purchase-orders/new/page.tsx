'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import VendorSearch from '@/components/ui/VendorSearch'
import POLineItems, { LineItem } from '@/components/ui/POLineItems'
import { generatePONumber } from '@/lib/utils'

export default function NewPOPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [centres, setCentres] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [vendor, setVendor] = useState<any>(null)
  const [items, setItems] = useState<LineItem[]>([])
  const [centreId, setCentreId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')

  // New fields
  const [supplyType, setSupplyType] = useState<'intra_state' | 'inter_state'>('intra_state')
  const [quotationRef, setQuotationRef] = useState('')
  const [quotationDate, setQuotationDate] = useState('')
  const [freightAmount, setFreightAmount] = useState('')
  const [loadingCharges, setLoadingCharges] = useState('')
  const [insuranceCharges, setInsuranceCharges] = useState('')
  const [otherCharges, setOtherCharges] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: cens }] = await Promise.all([
        supabase.from('user_profiles').select('*, centre:centres(*)').eq('id', user.id).single(),
        supabase.from('centres').select('id, code, name, state').eq('is_active', true).order('code'),
      ])

      if (prof) { setProfile(prof); setCentreId(prof.centre_id || '') }
      if (cens) setCentres(cens)

      const vendorId = searchParams.get('vendor')
      if (vendorId) {
        const { data: v } = await supabase
          .from('vendors')
          .select('id, vendor_code, legal_name, trade_name, state, trade_discount_percent, cash_discount_percent, payment_terms, tds_applicable, tds_section, tds_rate, category:vendor_categories(name)')
          .eq('id', vendorId)
          .single()
        if (v) {
          setVendor(v)
          if (v.payment_terms) setPaymentTerms(v.payment_terms)
        }
      }
    }
    load()
  }, [])

  // Auto-detect supply type from vendor + centre state
  useEffect(() => {
    if (vendor?.state && centreId) {
      const centre = centres.find(c => c.id === centreId)
      if (centre?.state && vendor.state !== centre.state) {
        setSupplyType('inter_state')
      } else {
        setSupplyType('intra_state')
      }
    }
  }, [vendor, centreId, centres])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!vendor) { toast.error('Please select a vendor'); return }
    if (!centreId) { toast.error('Please select a centre'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    if (items.some(i => i.rate <= 0)) { toast.error('All items must have a rate > 0'); return }

    const rateViolations = items.filter(i => i.rate_warning)
    if (rateViolations.length > 0) {
      const proceed = window.confirm(
        `${rateViolations.length} item(s) deviate from contract rate (>±0.5%).\nThis PO will need higher-level approval. Continue?`
      )
      if (!proceed) return
    }

    setLoading(true)
    const centreCode = centres.find(c => c.id === centreId)?.code || 'XXX'

    let poNumber: string
    try {
      const seqRes = await fetch(`/api/sequence?type=po&centre_code=${centreCode}`)
      const seqData = await seqRes.json()
      poNumber = seqData.number || generatePONumber(centreCode, Date.now() % 1000)
    } catch {
      const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
      poNumber = generatePONumber(centreCode, (count ?? 0) + 1)
    }

    const subtotal = items.reduce((s, i) => s + i.ordered_qty * i.net_rate, 0)
    const cgstAmount = items.reduce((s, i) => s + i.cgst_amount, 0)
    const sgstAmount = items.reduce((s, i) => s + i.sgst_amount, 0)
    const igstAmount = items.reduce((s, i) => s + i.igst_amount, 0)
    const gstAmount = cgstAmount + sgstAmount + igstAmount
    const discountAmt = items.reduce((s, i) => s + i.trade_discount_amount, 0)
    const freight = parseFloat(freightAmount) || 0
    const loadChg = parseFloat(loadingCharges) || 0
    const insChg = parseFloat(insuranceCharges) || 0
    const othChg = parseFloat(otherCharges) || 0
    const netAmount = subtotal + gstAmount + freight + loadChg + insChg + othChg
    const totalAmount = netAmount

    let status = 'pending_approval'
    let approverRole = 'unit_purchase_manager'
    if (totalAmount <= 10000) { status = 'approved' }
    else if (totalAmount <= 50000) { approverRole = 'unit_purchase_manager' }
    else if (totalAmount <= 200000) { approverRole = 'unit_cao' }
    else if (totalAmount <= 1000000) { approverRole = 'group_cao' }
    else { approverRole = 'group_admin' }

    if (rateViolations.length > 0 && status === 'approved') {
      status = 'pending_approval'; approverRole = 'unit_cao'
    }

    const rateNotes = rateViolations.length > 0
      ? `[RATE CONTRACT OVERRIDE] ${rateViolations.map(i => `${i.generic_name}: ₹${i.rate} vs contract ₹${i.contract_rate}`).join('; ')}${notes.trim() ? ' | ' + notes.trim() : ''}`
      : notes.trim() || null

    const { data: po, error } = await supabase.from('purchase_orders').insert({
      po_number: poNumber, centre_id: centreId, vendor_id: vendor.id, status,
      po_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: expectedDelivery || null, priority,
      subtotal, gst_amount: gstAmount, total_amount: totalAmount,
      cgst_amount: cgstAmount, sgst_amount: sgstAmount, igst_amount: igstAmount,
      discount_amount: discountAmt, freight_amount: freight, loading_charges: loadChg,
      insurance_charges: insChg, other_charges: othChg, net_amount: netAmount,
      terms_and_conditions: termsAndConditions.trim() || null,
      delivery_instructions: deliveryInstructions.trim() || null,
      payment_terms: paymentTerms.trim() || null,
      quotation_ref: quotationRef.trim() || null,
      quotation_date: quotationDate || null,
      tds_applicable: vendor.tds_applicable || false,
      tds_section: vendor.tds_section || null,
      tds_rate: vendor.tds_rate || null,
      notes: rateNotes, created_by: profile?.id,
      current_approval_level: status === 'approved' ? 0 : 1,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    const lineItems = items.map(item => ({
      po_id: po.id, item_id: item.item_id,
      ordered_qty: item.ordered_qty, free_qty: item.free_qty,
      received_qty: 0, pending_qty: item.ordered_qty,
      unit: item.unit, purchase_unit: item.purchase_unit,
      conversion_factor: item.conversion_factor, base_qty: item.base_qty,
      rate: item.rate, net_rate: item.net_rate, mrp: item.mrp || null,
      trade_discount_percent: item.trade_discount_percent,
      trade_discount_amount: item.trade_discount_amount,
      cash_discount_percent: item.cash_discount_percent,
      special_discount_percent: item.special_discount_percent,
      gst_percent: item.gst_percent, gst_amount: item.gst_amount,
      cgst_percent: item.cgst_percent, sgst_percent: item.sgst_percent,
      igst_percent: item.igst_percent, cgst_amount: item.cgst_amount,
      sgst_amount: item.sgst_amount, igst_amount: item.igst_amount,
      total_amount: item.total_amount, hsn_code: item.hsn_code || null,
      manufacturer: item.manufacturer || null, delivery_date: item.delivery_date || null,
    }))

    const { error: itemError } = await supabase.from('purchase_order_items').insert(lineItems)
    if (itemError) { toast.error(itemError.message); setLoading(false); return }

    if (status === 'pending_approval') {
      await supabase.from('po_approvals').insert({
        po_id: po.id, approval_level: 1, approver_role: approverRole, status: 'pending',
      })
    }

    toast.success(`PO ${poNumber} created`)
    router.push(`/purchase-orders/${po.id}`)
  }

  return (
    <div className="max-w-6xl">
      <div className="page-header">
        <div>
          <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Purchase Orders
          </Link>
          <h1 className="page-title">New Purchase Order</h1>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create PO</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Centre, Vendor, Priority */}
        <div className="card p-6">
          <h2 className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="form-label">Centre *</label>
              <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
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
              <label className="form-label">Supply Type</label>
              <select className="form-select" value={supplyType} onChange={e => setSupplyType(e.target.value as any)}>
                <option value="intra_state">Intra-State (CGST+SGST)</option>
                <option value="inter_state">Inter-State (IGST)</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="form-label">Vendor *</label>
              <VendorSearch value={vendor} onChange={setVendor} centreId={centreId} />
            </div>
            <div>
              <label className="form-label">Expected Delivery</label>
              <input type="date" className="form-input" value={expectedDelivery}
                onChange={e => setExpectedDelivery(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Quotation Ref</label>
              <input className="form-input" value={quotationRef} onChange={e => setQuotationRef(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Quotation Date</label>
              <input type="date" className="form-input" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6">
          <h2 className="font-semibold text-[#1B3A6B] mb-4 pb-2 border-b bg-[#EEF2F9] -mx-6 -mt-6 px-6 py-3 rounded-t-lg">Line Items</h2>
          <div className="mt-4">
            <POLineItems items={items} onChange={setItems} vendorId={vendor?.id} supplyType={supplyType} />
          </div>
        </div>

        {/* Additional Charges */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Additional Charges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="form-label">Freight</label><input type="number" step="0.01" className="form-input" value={freightAmount} onChange={e => setFreightAmount(e.target.value)} min="0" /></div>
            <div><label className="form-label">Loading</label><input type="number" step="0.01" className="form-input" value={loadingCharges} onChange={e => setLoadingCharges(e.target.value)} min="0" /></div>
            <div><label className="form-label">Insurance</label><input type="number" step="0.01" className="form-input" value={insuranceCharges} onChange={e => setInsuranceCharges(e.target.value)} min="0" /></div>
            <div><label className="form-label">Other</label><input type="number" step="0.01" className="form-input" value={otherCharges} onChange={e => setOtherCharges(e.target.value)} min="0" /></div>
          </div>
        </div>

        {/* Terms */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Terms & Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Payment Terms</label><input className="form-input" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30 from GRN date" /></div>
            <div><label className="form-label">Notes</label><input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div><label className="form-label">Terms & Conditions</label><textarea className="form-input" rows={3} value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)} /></div>
            <div><label className="form-label">Delivery Instructions</label><textarea className="form-input" rows={3} value={deliveryInstructions} onChange={e => setDeliveryInstructions(e.target.value)} /></div>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create PO</>}
          </button>
          <Link href="/purchase-orders" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
