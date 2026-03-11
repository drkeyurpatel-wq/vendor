'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateGRNNumber, formatCurrency } from '@/lib/utils'

interface GRNLineItem {
  po_item_id: string
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  ordered_qty: number
  already_received: number
  received_qty: number
  accepted_qty: number
  rejected_qty: number
  rejection_reason: string
  batch_no: string
  expiry_date: string
}

export default function NewGRNPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [eligiblePOs, setEligiblePOs] = useState<any[]>([])
  const [selectedPO, setSelectedPO] = useState<any>(null)
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([])
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0])
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('')
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState('')
  const [vendorInvoiceAmount, setVendorInvoiceAmount] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase.from('user_profiles').select('*, centre:centres(*)').eq('id', user.id).single()
      if (prof) setProfile(prof)

      // Get eligible POs (approved or sent_to_vendor or partially_received)
      let poQuery = supabase
        .from('purchase_orders')
        .select('id, po_number, vendor:vendors(legal_name), centre:centres(code, name), total_amount, status')
        .in('status', ['approved', 'sent_to_vendor', 'partially_received'])
        .is('deleted_at', null)
        .order('po_date', { ascending: false })

      if (prof && prof.centre_id && !['group_admin', 'group_cao'].includes(prof.role)) {
        poQuery = poQuery.eq('centre_id', prof.centre_id)
      }

      const { data: pos } = await poQuery
      if (pos) setEligiblePOs(pos)

      // Pre-select PO from URL
      const poId = searchParams.get('po')
      if (poId && pos) {
        const found = pos.find((p: any) => p.id === poId)
        if (found) loadPOItems(found)
      }
    }
    load()
  }, [])

  async function loadPOItems(po: any) {
    setSelectedPO(po)
    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('*, item:items(item_code, generic_name)')
      .eq('po_id', po.id)

    if (poItems) {
      setLineItems(poItems.map((pi: any) => ({
        po_item_id: pi.id,
        item_id: pi.item_id,
        item_code: pi.item?.item_code || '',
        generic_name: pi.item?.generic_name || '',
        unit: pi.unit,
        ordered_qty: pi.ordered_qty,
        already_received: pi.received_qty || 0,
        received_qty: pi.ordered_qty - (pi.received_qty || 0),
        accepted_qty: pi.ordered_qty - (pi.received_qty || 0),
        rejected_qty: 0,
        rejection_reason: '',
        batch_no: '',
        expiry_date: '',
      })))
    }
  }

  function updateLine(idx: number, field: string, value: any) {
    const updated = [...lineItems]
    const line = { ...updated[idx], [field]: value }

    if (field === 'received_qty') {
      const maxReceivable = line.ordered_qty - line.already_received
      line.received_qty = Math.min(Math.max(0, value), maxReceivable)
      line.accepted_qty = line.received_qty
      line.rejected_qty = 0
    }
    if (field === 'rejected_qty') {
      line.rejected_qty = Math.min(Math.max(0, value), line.received_qty)
      line.accepted_qty = line.received_qty - line.rejected_qty
    }

    updated[idx] = line
    setLineItems(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPO) { toast.error('Select a purchase order'); return }
    if (lineItems.every(li => li.received_qty === 0)) { toast.error('At least one item must have received qty > 0'); return }

    setLoading(true)

    const centreCode = selectedPO.centre?.code || 'XXX'

    // Use atomic DB sequence for race-safe numbering
    let grnNumber: string
    try {
      const seqRes = await fetch(`/api/sequence?type=grn&centre_code=${centreCode}`)
      const seqData = await seqRes.json()
      grnNumber = seqData.number || generateGRNNumber(centreCode, Date.now() % 1000)
    } catch {
      const { count } = await supabase.from('grns').select('*', { count: 'exact', head: true })
      grnNumber = generateGRNNumber(centreCode, (count ?? 0) + 1)
    }

    // Determine if any rejections
    const hasDiscrepancy = lineItems.some(li => li.rejected_qty > 0)

    const { data: grn, error } = await supabase.from('grns').insert({
      grn_number: grnNumber,
      centre_id: selectedPO.centre_id || profile?.centre_id,
      po_id: selectedPO.id,
      vendor_id: selectedPO.vendor_id,
      grn_date: grnDate,
      vendor_invoice_no: vendorInvoiceNo.trim() || null,
      vendor_invoice_date: vendorInvoiceDate || null,
      vendor_invoice_amount: vendorInvoiceAmount ? parseFloat(vendorInvoiceAmount) : null,
      status: hasDiscrepancy ? 'discrepancy' : 'submitted',
      notes: notes.trim() || null,
      received_by: profile?.id,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Insert GRN items
    const grnItems = lineItems
      .filter(li => li.received_qty > 0)
      .map(li => ({
        grn_id: grn.id,
        po_item_id: li.po_item_id,
        item_id: li.item_id,
        received_qty: li.received_qty,
        accepted_qty: li.accepted_qty,
        rejected_qty: li.rejected_qty,
        rejection_reason: li.rejection_reason.trim() || null,
        batch_no: li.batch_no.trim() || null,
        expiry_date: li.expiry_date || null,
      }))

    const { error: itemError } = await supabase.from('grn_items').insert(grnItems)
    if (itemError) { toast.error(itemError.message); setLoading(false); return }

    // Update PO item received quantities
    for (const li of lineItems) {
      if (li.accepted_qty > 0) {
        const newReceived = li.already_received + li.accepted_qty
        await supabase.from('purchase_order_items')
          .update({ received_qty: newReceived })
          .eq('id', li.po_item_id)

        // Update stock
        const { data: existing } = await supabase
          .from('item_centre_stock')
          .select('id, current_stock')
          .eq('item_id', li.item_id)
          .eq('centre_id', selectedPO.centre_id || profile?.centre_id)
          .single()

        if (existing) {
          await supabase.from('item_centre_stock')
            .update({
              current_stock: existing.current_stock + li.accepted_qty,
              last_grn_date: grnDate,
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('item_centre_stock').insert({
            item_id: li.item_id,
            centre_id: selectedPO.centre_id || profile?.centre_id,
            current_stock: li.accepted_qty,
            reorder_level: 0,
            max_level: 0,
            last_grn_date: grnDate,
          })
        }

        // Write stock ledger
        await supabase.from('stock_ledger').insert({
          item_id: li.item_id,
          centre_id: selectedPO.centre_id || profile?.centre_id,
          transaction_type: 'grn_receipt',
          quantity: li.accepted_qty,
          balance_after: (existing?.current_stock || 0) + li.accepted_qty,
          reference_type: 'grn',
          reference_id: grn.id,
          batch_no: li.batch_no.trim() || null,
        })
      }
    }

    // Update PO status
    const { data: allPOItems } = await supabase
      .from('purchase_order_items')
      .select('ordered_qty, received_qty')
      .eq('po_id', selectedPO.id)

    if (allPOItems) {
      const allFullyReceived = allPOItems.every((i: any) => i.received_qty >= i.ordered_qty)
      const anyReceived = allPOItems.some((i: any) => i.received_qty > 0)
      const newPOStatus = allFullyReceived ? 'fully_received' : anyReceived ? 'partially_received' : selectedPO.status
      await supabase.from('purchase_orders').update({ status: newPOStatus }).eq('id', selectedPO.id)
    }

    toast.success(`GRN ${grnNumber} created successfully`)
    router.push(`/grn/${grn.id}`)
  }

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href="/grn" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to GRNs
          </Link>
          <h1 className="page-title">New Goods Receipt Note</h1>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Save size={16} /> Submit GRN</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Select Purchase Order</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Purchase Order *</label>
              <select
                className="form-select"
                value={selectedPO?.id || ''}
                onChange={e => {
                  const po = eligiblePOs.find(p => p.id === e.target.value)
                  if (po) loadPOItems(po)
                  else { setSelectedPO(null); setLineItems([]) }
                }}
              >
                <option value="">Select a PO...</option>
                {eligiblePOs.map(po => (
                  <option key={po.id} value={po.id}>
                    {po.po_number} — {po.vendor?.legal_name} ({po.centre?.code}) — {po.status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">GRN Date *</label>
              <input type="date" className="form-input" value={grnDate} onChange={e => setGrnDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
        </div>

        {/* Vendor Invoice */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Vendor Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Invoice Number</label>
              <input className="form-input" value={vendorInvoiceNo} onChange={e => setVendorInvoiceNo(e.target.value)} placeholder="Vendor invoice #" />
            </div>
            <div>
              <label className="form-label">Invoice Date</label>
              <input type="date" className="form-input" value={vendorInvoiceDate} onChange={e => setVendorInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Invoice Amount (Rs)</label>
              <input type="number" step="0.01" className="form-input" value={vendorInvoiceAmount} onChange={e => setVendorInvoiceAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Line Items */}
        {lineItems.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Receiving Items</h2>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Ordered</th>
                    <th>Already Recv</th>
                    <th>Receiving</th>
                    <th>Accepted</th>
                    <th>Rejected</th>
                    <th>Batch No.</th>
                    <th>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, idx) => (
                    <tr key={li.po_item_id}>
                      <td>
                        <div className="font-medium text-gray-900 text-sm">{li.generic_name}</div>
                        <div className="font-mono text-xs text-gray-400">{li.item_code} | {li.unit}</div>
                      </td>
                      <td className="text-sm font-medium">{li.ordered_qty}</td>
                      <td className="text-sm text-gray-500">{li.already_received}</td>
                      <td>
                        <input type="number" min="0" max={li.ordered_qty - li.already_received}
                          className="form-input w-20 text-center"
                          value={li.received_qty}
                          onChange={e => updateLine(idx, 'received_qty', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="text-sm text-green-600 font-medium">{li.accepted_qty}</td>
                      <td>
                        <input type="number" min="0" max={li.received_qty}
                          className="form-input w-20 text-center"
                          value={li.rejected_qty}
                          onChange={e => updateLine(idx, 'rejected_qty', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <input className="form-input w-28" value={li.batch_no}
                          onChange={e => updateLine(idx, 'batch_no', e.target.value)} placeholder="Batch" />
                      </td>
                      <td>
                        <input type="date" className="form-input w-36" value={li.expiry_date}
                          onChange={e => updateLine(idx, 'expiry_date', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lineItems.some(li => li.rejected_qty > 0) && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold text-red-700">Rejection Reasons</h3>
                {lineItems.filter(li => li.rejected_qty > 0).map((li, idx) => (
                  <div key={li.po_item_id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-40">{li.generic_name}:</span>
                    <input className="form-input flex-1" value={li.rejection_reason}
                      onChange={e => {
                        const i = lineItems.findIndex(l => l.po_item_id === li.po_item_id)
                        updateLine(i, 'rejection_reason', e.target.value)
                      }}
                      placeholder="Reason for rejection..." />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Save size={16} /> Submit GRN</>}
          </button>
          <Link href="/grn" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
