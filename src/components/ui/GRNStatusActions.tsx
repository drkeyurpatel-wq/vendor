'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'
import { fireNotification } from '@/lib/notifications'

interface Props {
  grnId: string
  grnNumber: string
  currentStatus: string
  qualityStatus?: string
  poId: string
  vendorId: string
  centreId: string
  userRole: string
  lineItems: any[]
}

type DialogType = 'verify' | 'reject' | 'discrepancy' | 'qc_approve' | 'qc_reject' | 'resubmit' | null

export default function GRNStatusActions({ grnId, grnNumber, currentStatus, qualityStatus, poId, vendorId, centreId, userRole, lineItems }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')

  const canVerify = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  const canQC = ['group_admin', 'unit_cao', 'unit_purchase_manager', 'store_staff'].includes(userRole)
  const isSubmitted = currentStatus === 'submitted'
  const isDraft = currentStatus === 'draft'
  const isDiscrepancy = currentStatus === 'discrepancy'
  const qcPending = !qualityStatus || qualityStatus === 'pending'

  async function updateGRNStatus(newStatus: string) {
    const { error } = await supabase.from('grns').update({
      status: newStatus,
      ...(newStatus === 'verified' ? { verified_at: new Date().toISOString(), verified_by: (await supabase.auth.getUser()).data.user?.id } : {}),
      notes: comment || null,
      updated_at: new Date().toISOString(),
    }).eq('id', grnId)

    if (error) { toast.error(error.message); return }

    // If verified, update PO received quantities and stock
    if (newStatus === 'verified' && lineItems.length > 0) {
      for (const li of lineItems) {
        if (li.item_id && li.received_qty > 0) {
          // Update PO line item received qty
          const { data: poItem } = await supabase.from('purchase_order_items')
            .select('id, received_qty, ordered_qty')
            .eq('po_id', poId).eq('item_id', li.item_id).single()

          if (poItem) {
            const newRecv = (poItem.received_qty || 0) + li.received_qty
            await supabase.from('purchase_order_items').update({ received_qty: newRecv }).eq('id', poItem.id)
          }

          // Update stock — ADDITIVE, not overwrite
          const { data: existing } = await supabase.from('item_centre_stock')
            .select('id, current_stock')
            .eq('item_id', li.item_id).eq('centre_id', centreId).single()

          if (existing) {
            await supabase.from('item_centre_stock').update({
              current_stock: (existing.current_stock || 0) + li.received_qty,
              last_grn_date: new Date().toISOString().split('T')[0],
              last_grn_rate: li.rate || 0,
            }).eq('id', existing.id)
          } else {
            await supabase.from('item_centre_stock').insert({
              item_id: li.item_id, centre_id: centreId,
              current_stock: li.received_qty,
              last_grn_date: new Date().toISOString().split('T')[0],
              last_grn_rate: li.rate || 0,
            })
          }
        }
      }

      // Check if PO is fully received
      const { data: allPoItems } = await supabase.from('purchase_order_items')
        .select('id, item_id, ordered_qty, received_qty, rate, net_rate, unit, gst_percent, gst_amount, trade_discount_percent, specifications')
        .eq('po_id', poId)
      const allReceived = allPoItems?.every((i: any) => (i.received_qty || 0) >= i.ordered_qty)
      const someReceived = allPoItems?.some((i: any) => (i.received_qty || 0) > 0)

      if (allReceived) {
        await supabase.from('purchase_orders').update({ status: 'fully_received' }).eq('id', poId)
      } else if (someReceived) {
        await supabase.from('purchase_orders').update({ status: 'partially_received' }).eq('id', poId)

        // ── BACKORDER PO: Auto-create for short-delivered items ──
        const shortItems = (allPoItems ?? []).filter((i: any) => {
          const remaining = i.ordered_qty - (i.received_qty || 0)
          return remaining > 0
        })

        if (shortItems.length > 0) {
          try {
            // Fetch original PO for vendor/centre/delivery info
            const { data: originalPO } = await supabase.from('purchase_orders')
              .select('id, po_number, vendor_id, centre_id, delivery_address, payment_terms, terms_and_conditions, centre:centres(code)')
              .eq('id', poId).single()

            if (originalPO) {
              const centreCode = (originalPO.centre as any)?.code || 'SHI'
              // Generate PO number via sequence API, fallback to count-based
              let backorderPoNumber: string
              try {
                const seqRes = await fetch(`${typeof window !== 'undefined' ? window.location.origin : ''}/api/sequence?type=po&centre_code=${centreCode}`)
                if (seqRes.ok) {
                  const seqData = await seqRes.json()
                  backorderPoNumber = seqData.number
                } else { throw new Error('seq failed') }
              } catch {
                const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
                const now = new Date()
                const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
                backorderPoNumber = `H1-${centreCode}-PO-${ym}-${String((count ?? 0) + 1).padStart(3, '0')}`
              }

              // Calculate totals for backorder items
              const backorderItems = shortItems.map((i: any) => {
                const remainingQty = i.ordered_qty - (i.received_qty || 0)
                const lineTotal = remainingQty * (i.net_rate || i.rate || 0)
                const gstAmt = lineTotal * ((i.gst_percent || 0) / 100)
                return {
                  item_id: i.item_id,
                  ordered_qty: remainingQty,
                  received_qty: 0,
                  pending_qty: remainingQty,
                  cancelled_qty: 0,
                  free_qty: 0,
                  unit: i.unit || 'nos',
                  conversion_factor: 1,
                  rate: i.rate || 0,
                  net_rate: i.net_rate || i.rate || 0,
                  trade_discount_percent: i.trade_discount_percent || 0,
                  trade_discount_amount: 0,
                  cash_discount_percent: 0,
                  special_discount_percent: 0,
                  gst_percent: i.gst_percent || 0,
                  gst_amount: gstAmt,
                  cgst_amount: gstAmt / 2,
                  sgst_amount: gstAmt / 2,
                  igst_amount: 0,
                  line_total: lineTotal + gstAmt,
                  specifications: i.specifications,
                }
              })

              const subtotal = backorderItems.reduce((s, i) => s + (i.ordered_qty * i.rate), 0)
              const gstTotal = backorderItems.reduce((s, i) => s + i.gst_amount, 0)
              const totalAmount = subtotal + gstTotal

              const userId = (await supabase.auth.getUser()).data.user?.id

              const { data: backorderPO, error: boErr } = await supabase.from('purchase_orders').insert({
                po_number: backorderPoNumber,
                vendor_id: originalPO.vendor_id,
                centre_id: originalPO.centre_id,
                po_date: new Date().toISOString().split('T')[0],
                status: 'draft',
                priority: 'urgent',
                amended_from: poId,
                delivery_address: originalPO.delivery_address,
                payment_terms: originalPO.payment_terms,
                terms_and_conditions: originalPO.terms_and_conditions,
                notes: `Backorder from ${originalPO.po_number} — GRN ${grnNumber} short delivery (${shortItems.length} items)`,
                subtotal, gst_amount: gstTotal, total_amount: totalAmount, net_amount: totalAmount,
                created_by: userId,
              }).select('id, po_number').single()

              if (backorderPO && !boErr) {
                // Insert line items
                const boItems = backorderItems.map(i => ({ ...i, po_id: backorderPO.id }))
                await supabase.from('purchase_order_items').insert(boItems)

                // Audit
                try { await supabase.from('activity_log').insert({
                  entity_type: 'purchase_order', entity_id: backorderPO.id,
                  action: 'backorder_po_created',
                  details: { parent_po: originalPO.po_number, grn: grnNumber, short_items: shortItems.length },
                }) } catch { /* non-critical */ }

                toast.success(`Backorder PO ${backorderPO.po_number} created (${shortItems.length} short items)`, { duration: 6000 })
              }
            }
          } catch (boError: any) {
            // Non-blocking — GRN verify succeeded, backorder is bonus
            console.error('Backorder PO creation failed:', boError)
            toast.error('GRN verified, but backorder PO creation failed. Create manually.', { duration: 5000 })
          }
        }
      }
    }

    try { await supabase.from('activity_log').insert({
      entity_type: 'grn', entity_id: grnId,
      action: `grn_${newStatus}`, details: { grn_number: grnNumber, comment: comment || null },
    }) } catch { /* non-critical */ }

    toast.success(`GRN ${grnNumber} → ${newStatus.replace(/_/g, ' ')}`)
    fireNotification({ action: `grn_${newStatus}`, entity_type: 'grn', entity_id: grnId, details: { grn_number: grnNumber } })
    setDialog(null); setComment(''); router.refresh()
  }

  async function updateQCStatus(newStatus: string) {
    const { error } = await supabase.from('grns').update({
      quality_status: newStatus,
      qc_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', grnId)

    if (error) { toast.error(error.message); return }

    try { await supabase.from('activity_log').insert({
      entity_type: 'grn', entity_id: grnId,
      action: `qc_${newStatus}`, details: { grn_number: grnNumber, comment: comment || null },
    }) } catch { /* non-critical */ }

    toast.success(`QC ${newStatus} for ${grnNumber}`)
    setDialog(null); setComment(''); router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* GRN Status Actions */}
        {(isSubmitted || isDraft) && canVerify && (
          <>
            <button onClick={() => setDialog('verify')} className="btn-primary text-sm">
              <CheckCircle2 size={14} /> Verify GRN
            </button>
            <button onClick={() => setDialog('discrepancy')} className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium">
              <AlertTriangle size={14} className="inline mr-1" /> Flag Discrepancy
            </button>
            <button onClick={() => setDialog('reject')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
              <XCircle size={14} className="inline mr-1" /> Reject
            </button>
          </>
        )}

        {isDiscrepancy && canVerify && (
          <button onClick={() => setDialog('resubmit')} className="btn-primary text-sm">
            <RotateCcw size={14} /> Resubmit for Verification
          </button>
        )}

        {/* QC Actions */}
        {currentStatus === 'verified' && qcPending && canQC && (
          <>
            <button onClick={() => setDialog('qc_approve')} className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium">
              <ClipboardCheck size={14} className="inline mr-1" /> QC Approve
            </button>
            <button onClick={() => setDialog('qc_reject')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
              <XCircle size={14} className="inline mr-1" /> QC Reject
            </button>
          </>
        )}
      </div>

      <ConfirmDialog open={dialog === 'verify'} onClose={() => setDialog(null)}
        title="Verify GRN" description={`Verify that all items in GRN ${grnNumber} have been physically received, counted, and match the delivery challan.`}
        confirmLabel="Verify" confirmVariant="primary" showCommentBox comment={comment} onCommentChange={setComment}
        onConfirm={() => updateGRNStatus('verified')} />

      <ConfirmDialog open={dialog === 'reject'} onClose={() => setDialog(null)}
        title="Reject GRN" description={`Reject GRN ${grnNumber}. The vendor will need to re-deliver or the PO line items will remain open.`}
        confirmLabel="Reject" confirmVariant="danger" showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateGRNStatus('rejected')} />

      <ConfirmDialog open={dialog === 'discrepancy'} onClose={() => setDialog(null)}
        title="Flag Discrepancy" description={`Flag GRN ${grnNumber} for quantity/quality discrepancy. Store team must resolve before verification.`}
        confirmLabel="Flag" confirmVariant="warning" showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateGRNStatus('discrepancy')} />

      <ConfirmDialog open={dialog === 'resubmit'} onClose={() => setDialog(null)}
        title="Resubmit GRN" description={`Resubmit GRN ${grnNumber} for verification after resolving discrepancy.`}
        confirmLabel="Resubmit" confirmVariant="primary" showCommentBox comment={comment} onCommentChange={setComment}
        onConfirm={() => updateGRNStatus('submitted')} />

      <ConfirmDialog open={dialog === 'qc_approve'} onClose={() => setDialog(null)}
        title="QC Approve" description={`Approve quality check for GRN ${grnNumber}. Items will be cleared for pharmacy/store use.`}
        confirmLabel="QC Approve" confirmVariant="primary" showCommentBox comment={comment} onCommentChange={setComment}
        onConfirm={() => updateQCStatus('approved')} />

      <ConfirmDialog open={dialog === 'qc_reject'} onClose={() => setDialog(null)}
        title="QC Reject" description={`Reject quality for GRN ${grnNumber}. A return-to-vendor process will be initiated.`}
        confirmLabel="QC Reject" confirmVariant="danger" showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateQCStatus('rejected')} />
    </>
  )
}
