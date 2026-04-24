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
    // ── GUARD: Prevent double stock update on re-verify ──
    // If this GRN was previously verified (verified_at exists), stock was already counted.
    // On re-verify after discrepancy, skip stock/PO updates — they were already applied.
    let skipStockUpdate = false
    if (newStatus === 'verified') {
      const { data: grnCheck } = await supabase
        .from('grns')
        .select('verified_at, status')
        .eq('id', grnId)
        .single()

      if (grnCheck?.verified_at) {
        // Was verified before — stock already counted. Only flip status back.
        skipStockUpdate = true
      }
    }

    const { error } = await supabase.from('grns').update({
      status: newStatus,
      ...(newStatus === 'verified' && !skipStockUpdate ? { verified_at: new Date().toISOString(), verified_by: (await supabase.auth.getUser()).data.user?.id } : {}),
      notes: comment || null,
      updated_at: new Date().toISOString(),
    }).eq('id', grnId)

    if (error) { toast.error(error.message); return }

    // If verified AND first-time verify, update PO received quantities and stock
    if (newStatus === 'verified' && !skipStockUpdate && lineItems.length > 0) {
      for (const li of lineItems) {
        // USE accepted_qty for stock, NOT received_qty
        // received=100, rejected=10, damaged=5 → stock += 85 (accepted), NOT 100
        // Apply conversion_factor: 85 strips × 10 tablets/strip = 850 tablets in stock
        const rawAccepted = li.accepted_qty ?? li.received_qty ?? 0
        const convFactor = li.conversion_factor || 1
        const stockQty = rawAccepted * convFactor
        if (li.item_id && stockQty > 0) {
          // Update PO line item received qty (use received_qty here — PO tracks total received)
          const { data: poItem } = await supabase.from('purchase_order_items')
            .select('id, received_qty, ordered_qty')
            .eq('po_id', poId).eq('item_id', li.item_id).single()

          if (poItem) {
            const newRecv = (poItem.received_qty || 0) + (li.received_qty || 0)
            await supabase.from('purchase_order_items').update({ received_qty: newRecv }).eq('id', poItem.id)
          }

          // Update stock — use ACCEPTED qty only (excludes rejected + damaged)
          const { data: existing } = await supabase.from('item_centre_stock')
            .select('id, current_stock')
            .eq('item_id', li.item_id).eq('centre_id', centreId).single()

          if (existing) {
            const newStockBalance = (existing.current_stock || 0) + stockQty
            await supabase.from('item_centre_stock').update({
              current_stock: newStockBalance,
              last_grn_date: new Date().toISOString().split('T')[0],
              last_grn_rate: li.rate || 0,
            }).eq('id', existing.id)

            // Write stock ledger for audit trail
            try {
              const userId = (await supabase.auth.getUser()).data.user?.id
              await supabase.from('stock_ledger').insert({
                centre_id: centreId,
                item_id: li.item_id,
                transaction_type: 'grn',
                quantity: stockQty,
                balance_after: newStockBalance,
                reference_id: grnId,
                reference_number: grnNumber,
                created_by: userId,
              })
            } catch { /* non-critical */ }
          } else {
            await supabase.from('item_centre_stock').insert({
              item_id: li.item_id, centre_id: centreId,
              current_stock: stockQty,
              last_grn_date: new Date().toISOString().split('T')[0],
              last_grn_rate: li.rate || 0,
            })

            // Write stock ledger for new stock record
            try {
              const userId = (await supabase.auth.getUser()).data.user?.id
              await supabase.from('stock_ledger').insert({
                centre_id: centreId,
                item_id: li.item_id,
                transaction_type: 'grn',
                quantity: stockQty,
                balance_after: stockQty,
                reference_id: grnId,
                reference_number: grnNumber,
                created_by: userId,
              })
            } catch { /* non-critical */ }
          }
        }
      }

      // Check if PO is fully received
      const { data: allPoItems } = await supabase.from('purchase_order_items')
        .select('id, item_id, ordered_qty, received_qty, rate, net_rate, unit, gst_percent, gst_amount, trade_discount_percent')
        .eq('po_id', poId)
      const allReceived = allPoItems?.every((i: any) => (i.received_qty || 0) >= i.ordered_qty)
      const someReceived = allPoItems?.some((i: any) => (i.received_qty || 0) > 0)

      if (allReceived) {
        await supabase.from('purchase_orders').update({ status: 'fully_received' }).eq('id', poId)
      } else if (someReceived) {
        await supabase.from('purchase_orders').update({ status: 'partially_received' }).eq('id', poId)
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
