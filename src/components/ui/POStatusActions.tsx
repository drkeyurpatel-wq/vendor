'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, XCircle, Copy, Lock, Truck, Printer, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'
import { fireNotification } from '@/lib/notifications'

interface Props {
  poId: string
  poNumber: string
  currentStatus: string
  vendorEmail?: string | null
  vendorPhone?: string | null
  userRole: string
  centreId: string
}

type DialogType = 'send_vendor' | 'cancel' | 'close' | 'reopen' | null

export default function POStatusActions({ poId, poNumber, currentStatus, vendorEmail, vendorPhone, userRole, centreId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')

  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  const canCancel = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole) && !['cancelled', 'closed', 'fully_received'].includes(currentStatus)
  const canSendToVendor = currentStatus === 'approved' && canManage
  const canClose = currentStatus === 'fully_received' && canManage
  const canReopen = currentStatus === 'cancelled' && ['group_admin'].includes(userRole)

  async function updateStatus(newStatus: string) {
    const { error } = await supabase.from('purchase_orders').update({
      status: newStatus,
      ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString(), cancellation_reason: comment } : {}),
      ...(newStatus === 'closed' ? { closed_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', poId)

    if (error) { toast.error(error.message); return }

    // Log audit
    await supabase.from('audit_logs').insert({
      entity_type: 'purchase_order', entity_id: poId,
      action: `status_changed_to_${newStatus}`,
      details: { from: currentStatus, to: newStatus, comment: comment || null, po_number: poNumber },
    }) // Don't fail on audit log error

    toast.success(`PO ${poNumber} → ${newStatus.replace(/_/g, ' ')}`)
    fireNotification({ action: `po_${newStatus}`, entity_type: 'purchase_order', entity_id: poId, details: { po_number: poNumber } })
    setDialog(null)
    setComment('')
    router.refresh()
  }

  async function duplicatePO() {
    // Fetch line items
    const { data: lineItems } = await supabase.from('purchase_order_items')
      .select('item_id, ordered_qty, free_qty, unit, rate, net_rate, mrp, trade_discount_percent, cash_discount_percent, special_discount_percent, gst_percent, cgst_percent, sgst_percent, igst_percent, cgst_amount, sgst_amount, igst_amount, gst_amount, total_amount, hsn_code, manufacturer, delivery_date')
      .eq('po_id', poId)

    // Fetch PO details
    const { data: po } = await supabase.from('purchase_orders')
      .select('vendor_id, centre_id, supply_type, payment_terms, terms_and_conditions, delivery_instructions, delivery_address, freight_amount, loading_charges, insurance_charges, other_charges, subtotal, gst_amount, total_amount, discount_amount')
      .eq('id', poId).single()

    if (!po) { toast.error('Could not fetch PO details'); return }

    // Generate new PO number
    const { count } = await supabase.from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('centre_id', centreId)

    const now = new Date()
    const newPoNum = `H1-DUP-${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { data: newPO, error: poErr } = await supabase.from('purchase_orders').insert({
      ...po, po_number: newPoNum, status: 'draft', po_date: now.toISOString().split('T')[0],
      notes: `Duplicated from ${poNumber}`,
    }).select('id').single()

    if (poErr || !newPO) { toast.error(poErr?.message || 'Failed'); return }

    if (lineItems && lineItems.length > 0) {
      await supabase.from('purchase_order_items').insert(
        lineItems.map(li => ({ ...li, po_id: newPO.id, received_qty: 0 }))
      )
    }

    toast.success(`Duplicated → ${newPoNum}`)
    router.push(`/purchase-orders/${newPO.id}/edit`)
  }

  if (!canManage) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canSendToVendor && (
          <button onClick={() => setDialog('send_vendor')} className="btn-primary text-sm">
            <Send size={14} /> Mark Sent to Vendor
          </button>
        )}

        {canClose && (
          <button onClick={() => setDialog('close')} className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium">
            <Lock size={14} className="inline mr-1" /> Close PO
          </button>
        )}

        {canReopen && (
          <button onClick={() => setDialog('reopen')} className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium">
            <RotateCcw size={14} className="inline mr-1" /> Reopen
          </button>
        )}

        <button onClick={duplicatePO} className="btn-secondary text-sm">
          <Copy size={14} /> Duplicate
        </button>

        {vendorEmail && (
          <a href={`mailto:${vendorEmail}?subject=Purchase Order ${poNumber}&body=Please find PO ${poNumber} attached.`}
            className="btn-secondary text-sm">
            <Send size={14} /> Email Vendor
          </a>
        )}

        {vendorPhone && currentStatus === 'approved' && (
          <button onClick={async () => {
            const pdfUrl = `${window.location.origin}/api/pdf/po?id=${poId}`
            const msg = `*PURCHASE ORDER — ${poNumber}*\n\nDear Vendor,\n\nPlease find PO ${poNumber} from Health1 Super Speciality Hospitals.\n\n📄 Download PO: ${pdfUrl}\n\nKindly acknowledge receipt and confirm expected delivery date.\n\nRegards,\nHealth1 Purchase Department`
            window.open(`https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
            // Auto-mark as sent
            await supabase.from('purchase_orders').update({ status: 'sent_to_vendor', sent_to_vendor_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', poId)
            fireNotification({ action: 'po_sent_to_vendor', entity_type: 'purchase_order', entity_id: poId, details: { po_number: poNumber, via: 'whatsapp' } })
            toast.success(`PO ${poNumber} sent via WhatsApp`)
            router.refresh()
          }} className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium flex items-center gap-1.5">
            <Send size={14} /> Send PO via WhatsApp
          </button>
        )}

        {vendorPhone && currentStatus !== 'approved' && (
          <a href={`https://wa.me/${vendorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`PO ${poNumber} - Health1 Hospitals. Status: ${currentStatus.replace(/_/g, ' ')}`)}`}
            target="_blank" className="btn-secondary text-sm">
            <Truck size={14} /> WhatsApp
          </a>
        )}

        {canCancel && (
          <button onClick={() => setDialog('cancel')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">
            <XCircle size={14} className="inline mr-1" /> Cancel PO
          </button>
        )}
      </div>

      {/* Send to Vendor */}
      <ConfirmDialog
        open={dialog === 'send_vendor'} onClose={() => setDialog(null)}
        title="Mark as Sent to Vendor"
        description={`Confirm that PO ${poNumber} has been communicated to the vendor via email, WhatsApp, or physical copy.`}
        confirmLabel="Mark Sent" confirmVariant="primary"
        onConfirm={() => updateStatus('sent_to_vendor')}
      />

      {/* Cancel */}
      <ConfirmDialog
        open={dialog === 'cancel'} onClose={() => setDialog(null)}
        title="Cancel Purchase Order"
        description={`This will cancel PO ${poNumber}. Any pending approvals will be voided. This action requires a reason.`}
        confirmLabel="Cancel PO" confirmVariant="danger"
        showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateStatus('cancelled')}
      />

      {/* Close */}
      <ConfirmDialog
        open={dialog === 'close'} onClose={() => setDialog(null)}
        title="Close Purchase Order"
        description={`Close PO ${poNumber}. No further GRNs or amendments will be allowed. Use this after all items are received and invoiced.`}
        confirmLabel="Close PO" confirmVariant="primary"
        showCommentBox comment={comment} onCommentChange={setComment}
        onConfirm={() => updateStatus('closed')}
      />

      {/* Reopen */}
      <ConfirmDialog
        open={dialog === 'reopen'} onClose={() => setDialog(null)}
        title="Reopen Cancelled PO"
        description={`Reopen PO ${poNumber} and set status back to draft. Only Group Admin can do this.`}
        confirmLabel="Reopen" confirmVariant="warning"
        showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateStatus('draft')}
      />
    </>
  )
}
