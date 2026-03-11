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

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: cens }] = await Promise.all([
        supabase.from('user_profiles').select('*, centre:centres(*)').eq('id', user.id).single(),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
      ])

      if (prof) {
        setProfile(prof)
        setCentreId(prof.centre_id || '')
      }
      if (cens) setCentres(cens)

      // Pre-fill vendor from URL param
      const vendorId = searchParams.get('vendor')
      if (vendorId) {
        const { data: v } = await supabase
          .from('vendors')
          .select('id, vendor_code, legal_name, trade_name, category:vendor_categories(name)')
          .eq('id', vendorId)
          .single()
        if (v) setVendor(v)
      }
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!vendor) { toast.error('Please select a vendor'); return }
    if (!centreId) { toast.error('Please select a centre'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    if (items.some(i => i.rate <= 0)) { toast.error('All items must have a rate > 0'); return }

    setLoading(true)

    const centreCode = centres.find(c => c.id === centreId)?.code || 'XXX'
    const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
    const poNumber = generatePONumber(centreCode, (count ?? 0) + 1)

    const subtotal = items.reduce((s, i) => s + i.ordered_qty * i.rate, 0)
    const gst_amount = items.reduce((s, i) => s + i.gst_amount, 0)
    const total_amount = items.reduce((s, i) => s + i.total_amount, 0)

    // Determine approval level
    let status = 'pending_approval'
    let approverRole = 'unit_purchase_manager'
    if (total_amount <= 10000) {
      status = 'approved' // auto-approve small POs
    } else if (total_amount <= 50000) {
      approverRole = 'unit_purchase_manager'
    } else if (total_amount <= 200000) {
      approverRole = 'unit_cao'
    } else if (total_amount <= 1000000) {
      approverRole = 'group_cao'
    } else {
      approverRole = 'group_admin'
    }

    const { data: po, error } = await supabase.from('purchase_orders').insert({
      po_number: poNumber,
      centre_id: centreId,
      vendor_id: vendor.id,
      status,
      po_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: expectedDelivery || null,
      priority,
      subtotal,
      gst_amount,
      total_amount,
      notes: notes.trim() || null,
      created_by: profile?.id,
      current_approval_level: status === 'approved' ? 0 : 1,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Insert line items
    const lineItems = items.map(item => ({
      po_id: po.id,
      item_id: item.item_id,
      ordered_qty: item.ordered_qty,
      received_qty: 0,
      unit: item.unit,
      rate: item.rate,
      gst_percent: item.gst_percent,
      gst_amount: item.gst_amount,
      total_amount: item.total_amount,
    }))

    const { error: itemError } = await supabase.from('purchase_order_items').insert(lineItems)
    if (itemError) { toast.error(itemError.message); setLoading(false); return }

    // Create approval record if not auto-approved
    if (status === 'pending_approval') {
      await supabase.from('po_approvals').insert({
        po_id: po.id,
        approval_level: 1,
        approver_role: approverRole,
        status: 'pending',
      })
    }

    toast.success(`PO ${poNumber} created successfully`)
    router.push(`/purchase-orders/${po.id}`)
  }

  return (
    <div className="max-w-5xl">
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
        {/* Centre & Vendor */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Vendor *</label>
              <VendorSearch value={vendor} onChange={setVendor} centreId={centreId} />
            </div>
            <div>
              <label className="form-label">Expected Delivery Date</label>
              <input
                type="date"
                className="form-input"
                value={expectedDelivery}
                onChange={e => setExpectedDelivery(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Line Items</h2>
          <POLineItems items={items} onChange={setItems} />
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
