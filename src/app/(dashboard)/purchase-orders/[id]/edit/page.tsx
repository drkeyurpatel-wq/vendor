'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import POLineItems, { LineItem } from '@/components/ui/POLineItems'
import VendorSearch from '@/components/ui/VendorSearch'

export default function EditPOPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notDraft, setNotDraft] = useState(false)
  const [centres, setCentres] = useState<any[]>([])
  const [vendor, setVendor] = useState<any>(null)
  const [items, setItems] = useState<LineItem[]>([])
  const [centreId, setCentreId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      // Fetch PO with vendor join
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, vendor:vendors(id, vendor_code, legal_name, trade_name, category:vendor_categories(name))')
        .eq('id', id)
        .single()

      if (poError || !po) {
        toast.error('Purchase order not found')
        router.push('/purchase-orders')
        return
      }

      if (po.status !== 'draft') {
        setNotDraft(true)
        setLoading(false)
        return
      }

      // Fetch PO items and centres in parallel
      const [{ data: poItems }, { data: cens }] = await Promise.all([
        supabase
          .from('purchase_order_items')
          .select('*, item:items(item_code, generic_name, unit, gst_percent)')
          .eq('po_id', id),
        supabase
          .from('centres')
          .select('id, code, name')
          .eq('is_active', true)
          .order('code'),
      ])

      // Pre-populate form
      setCentreId(po.centre_id || '')
      setVendor(po.vendor || null)
      setExpectedDelivery(po.expected_delivery_date || '')
      setPriority(po.priority || 'normal')
      setNotes(po.notes || '')

      if (cens) setCentres(cens)

      // Convert PO items to LineItem[] format
      if (poItems) {
        const lineItems: LineItem[] = poItems.map((pi: any) => ({
          item_id: pi.item_id,
          item_code: pi.item?.item_code || '',
          generic_name: pi.item?.generic_name || '',
          unit: pi.unit || pi.item?.unit || '',
          hsn_code: pi.hsn_code || '',
          manufacturer: pi.manufacturer || '',
          purchase_unit: pi.purchase_unit || pi.unit || pi.item?.unit || '',
          conversion_factor: pi.conversion_factor || 1,
          base_qty: pi.base_qty || pi.ordered_qty || 0,
          ordered_qty: pi.ordered_qty,
          free_qty: pi.free_qty || 0,
          rate: pi.rate,
          mrp: pi.mrp || 0,
          net_rate: pi.net_rate || pi.rate,
          trade_discount_percent: pi.trade_discount_percent || 0,
          trade_discount_amount: pi.trade_discount_amount || 0,
          cash_discount_percent: pi.cash_discount_percent || 0,
          special_discount_percent: pi.special_discount_percent || 0,
          gst_percent: pi.gst_percent ?? pi.item?.gst_percent ?? 0,
          cgst_percent: pi.cgst_percent || 0,
          sgst_percent: pi.sgst_percent || 0,
          igst_percent: pi.igst_percent || 0,
          cgst_amount: pi.cgst_amount || 0,
          sgst_amount: pi.sgst_amount || 0,
          igst_amount: pi.igst_amount || 0,
          gst_amount: pi.gst_amount,
          total_amount: pi.total_amount,
          delivery_date: pi.delivery_date || '',
        }))
        setItems(lineItems)
      }

      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!vendor) { toast.error('Please select a vendor'); return }
    if (!centreId) { toast.error('Please select a centre'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    if (items.some(i => i.rate <= 0)) { toast.error('All items must have a rate > 0'); return }
    if (items.some(i => !i.ordered_qty || i.ordered_qty <= 0)) { toast.error('All items must have quantity > 0'); return }

    setSaving(true)

    // ── GUARD: Recheck PO is still draft ──
    const { data: poRecheck } = await supabase
      .from('purchase_orders').select('status').eq('id', id).single()
    if (poRecheck?.status !== 'draft') {
      toast.error(`PO status changed to "${poRecheck?.status}". Only draft POs can be edited.`)
      setSaving(false)
      return
    }

    const subtotal = items.reduce((s, i) => s + i.ordered_qty * i.rate, 0)
    const gst_amount = items.reduce((s, i) => s + i.gst_amount, 0)
    const total_amount = items.reduce((s, i) => s + i.total_amount, 0)

    // ── Rate contract validation ──
    try {
      const { data: activeContracts } = await supabase
        .from('rate_contracts')
        .select('id, rate_contract_items(item_id, rate)')
        .eq('vendor_id', vendor.id)
        .eq('status', 'active')
        .limit(5)

      if (activeContracts && activeContracts.length > 0) {
        const contractRateMap = new Map<string, number>()
        for (const c of activeContracts) {
          const rcItems = (c as any).rate_contract_items || []
          for (const ri of rcItems) {
            contractRateMap.set(ri.item_id, ri.rate)
          }
        }

        const rateViolations = items.filter(i => {
          const contractRate = contractRateMap.get(i.item_id)
          if (!contractRate) return false
          return Math.abs(i.rate - contractRate) / contractRate > 0.005
        }).map(i => ({
          generic_name: i.generic_name || i.item_code || i.item_id,
          rate: i.rate,
          contract_rate: contractRateMap.get(i.item_id),
        }))

        if (rateViolations.length > 0) {
          const proceed = window.confirm(
            `${rateViolations.length} item(s) deviate from contract rate (>±0.5%).\n` +
            rateViolations.map(v => `${v.generic_name}: ₹${v.rate} vs contract ₹${v.contract_rate}`).join('\n') +
            `\n\nThis PO will need higher-level approval. Continue?`
          )
          if (!proceed) { setSaving(false); return }
        }
      }
    } catch { /* rate contract check non-blocking */ }

    // ── Credit limit check ──
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('credit_limit, minimum_order_value')
        .eq('id', vendor.id)
        .single()

      if (vendorData?.minimum_order_value && total_amount < vendorData.minimum_order_value) {
        const proceed = window.confirm(
          `PO total ₹${total_amount.toLocaleString()} is below vendor minimum order ₹${vendorData.minimum_order_value.toLocaleString()}.\n\nContinue anyway?`
        )
        if (!proceed) { setSaving(false); return }
      }

      if (vendorData?.credit_limit && vendorData.credit_limit > 0) {
        const { data: outstandingInv } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount')
          .eq('vendor_id', vendor.id)
          .neq('payment_status', 'paid')
        const outstanding = (outstandingInv ?? []).reduce((s, i: any) => s + (i.total_amount - (i.paid_amount || 0)), 0)
        if (outstanding + total_amount > vendorData.credit_limit) {
          const proceed = window.confirm(
            `CREDIT LIMIT WARNING\n\nOutstanding: ₹${outstanding.toLocaleString()}\nThis PO: ₹${total_amount.toLocaleString()}\nTotal: ₹${(outstanding + total_amount).toLocaleString()}\nCredit Limit: ₹${vendorData.credit_limit.toLocaleString()}\n\nExceeds limit by ₹${(outstanding + total_amount - vendorData.credit_limit).toLocaleString()}. Continue?`
          )
          if (!proceed) { setSaving(false); return }
        }
      }
    } catch { /* credit check non-blocking */ }

    // ── Determine approval status based on new total ──
    let status = 'pending_approval'
    let approverRole = 'group_admin'
    if (total_amount <= 10000) { status = 'approved' }
    else if (total_amount <= 50000) { approverRole = 'unit_purchase_manager' }
    else if (total_amount <= 200000) { approverRole = 'unit_cao' }
    else if (total_amount <= 1000000) { approverRole = 'group_cao' }

    // Update PO record with correct status
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        centre_id: centreId,
        vendor_id: vendor.id,
        expected_delivery_date: expectedDelivery || null,
        priority,
        notes: notes.trim() || null,
        subtotal,
        gst_amount,
        total_amount,
        net_amount: total_amount,
        status,
        current_approval_level: status === 'approved' ? 0 : 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      toast.error(updateError.message)
      setSaving(false)
      return
    }

    // Delete old line items
    const { error: deleteError } = await supabase
      .from('purchase_order_items')
      .delete()
      .eq('po_id', id)

    if (deleteError) {
      toast.error(deleteError.message)
      setSaving(false)
      return
    }

    // Insert new line items
    const lineItems = items.map(item => ({
      po_id: id,
      item_id: item.item_id,
      ordered_qty: item.ordered_qty,
      received_qty: 0,
      pending_qty: item.ordered_qty,
      cancelled_qty: 0,
      free_qty: 0,
      unit: item.unit,
      conversion_factor: 1,
      rate: item.rate,
      net_rate: item.rate,
      gst_percent: item.gst_percent,
      gst_amount: item.gst_amount,
      cgst_amount: item.gst_amount / 2,
      sgst_amount: item.gst_amount / 2,
      igst_amount: 0,
      trade_discount_percent: 0,
      trade_discount_amount: 0,
      cash_discount_percent: 0,
      special_discount_percent: 0,
      total_amount: item.total_amount,
    }))

    const { error: insertError } = await supabase
      .from('purchase_order_items')
      .insert(lineItems)

    if (insertError) {
      toast.error(insertError.message)
      setSaving(false)
      return
    }

    // Create approval record if pending
    if (status === 'pending_approval') {
      try {
        // Delete old approvals for this PO
        await supabase.from('po_approvals').delete().eq('po_id', id)
        await supabase.from('po_approvals').insert({
          po_id: id, approval_level: 1, approver_role: approverRole, status: 'pending',
        })
      } catch { /* non-critical */ }
    }

    toast.success(`PO updated → ${status === 'approved' ? 'auto-approved (≤₹10K)' : `pending ${approverRole.replace(/_/g, ' ')} approval`}`)
    router.push(`/purchase-orders/${id}`)
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this draft PO? This action cannot be undone.')) return

    setDeleting(true)

    const { error } = await supabase
      .from('purchase_orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }

    toast.success('Draft PO deleted')
    router.push('/purchase-orders')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    )
  }

  if (notDraft) {
    return (
      <div className="max-w-5xl">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Only draft POs can be edited</h2>
          <p className="text-gray-500 mb-4">This purchase order is no longer in draft status and cannot be modified.</p>
          <Link href={`/purchase-orders/${id}`} className="btn-primary">
            <ArrowLeft size={16} /> Back to Purchase Order
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href={`/purchase-orders/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Purchase Order
          </Link>
          <h1 className="page-title">Edit Purchase Order</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Delete Draft</>}
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Details */}
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

        <div className="flex gap-3 pb-6 flex-wrap">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
          </button>
          <Link href={`/purchase-orders/${id}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
