'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, AlertTriangle, CreditCard, Scale, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'
import { fireNotification } from '@/lib/notifications'

interface Props {
  invoiceId: string
  invoiceRef: string
  currentStatus: string
  matchStatus: string
  paymentStatus: string
  totalAmount: number
  paidAmount: number
  vendorId: string
  centreId: string
  poId?: string
  grnId?: string
  userRole: string
}

type DialogType = 'approve' | 'reject' | 'dispute' | 'schedule_payment' | 'mark_paid' | 'run_match' | null

export default function InvoiceActions({
  invoiceId, invoiceRef, currentStatus, matchStatus, paymentStatus,
  totalAmount, paidAmount, vendorId, centreId, poId, grnId, userRole
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')
  const [payAmount, setPayAmount] = useState(String(totalAmount - paidAmount))

  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)
  const canApprove = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)
  const canPay = ['group_admin', 'group_cao', 'finance_staff'].includes(userRole)
  const isPending = currentStatus === 'pending'
  const isApproved = currentStatus === 'approved'
  const isUnpaid = paymentStatus === 'unpaid' || paymentStatus === 'partial'
  const outstanding = totalAmount - paidAmount

  async function updateInvoiceStatus(newStatus: string) {
    const { error } = await supabase.from('invoices').update({
      status: newStatus,
      ...(newStatus === 'disputed' ? { dispute_reason: comment, disputed_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', invoiceId)

    if (error) { toast.error(error.message); return }

    await supabase.from('activity_log').insert({
      entity_type: 'invoice', entity_id: invoiceId,
      action: `invoice_${newStatus}`, details: { invoice_ref: invoiceRef, comment: comment || null },
    })

    toast.success(`Invoice ${invoiceRef} → ${newStatus}`)
    fireNotification({ action: `invoice_${newStatus}`, entity_type: 'invoice', entity_id: invoiceId, details: { invoice_ref: invoiceRef } })
    setDialog(null); setComment(''); router.refresh()
  }

  async function run3WayMatch() {
    try {
      const res = await fetch('/api/invoices/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Match failed'); return }

      const icon = data.match_status === 'matched' ? '✅' : data.match_status === 'partial_match' ? '⚠️' : '❌'
      toast.success(`${icon} 3-way match: ${data.match_status.replace(/_/g, ' ')} — ${data.summary?.matched || 0}/${data.summary?.total_items || 0} items matched`)
      setDialog(null); router.refresh()
    } catch {
      toast.error('3-way match failed — please retry')
    }
  }

  async function recordPayment() {
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0 || amt > outstanding + 0.01) {
      toast.error(`Amount must be between ₹1 and ₹${outstanding.toLocaleString()}`)
      return
    }

    const newPaid = paidAmount + amt
    const newStatus = newPaid >= totalAmount - 0.01 ? 'paid' : 'partial'

    const { error } = await supabase.from('invoices').update({
      paid_amount: Math.round(newPaid * 100) / 100,
      payment_status: newStatus,
      ...(newStatus === 'paid' ? { paid_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', invoiceId)

    if (error) { toast.error(error.message); return }

    await supabase.from('activity_log').insert({
      entity_type: 'invoice', entity_id: invoiceId,
      action: 'payment_recorded',
      details: { invoice_ref: invoiceRef, amount: amt, total_paid: newPaid, payment_status: newStatus },
    })

    toast.success(`₹${amt.toLocaleString()} recorded for ${invoiceRef}. ${newStatus === 'paid' ? 'Fully paid!' : `Outstanding: ₹${(outstanding - amt).toLocaleString()}`}`)
    setDialog(null); setComment(''); router.refresh()
  }

  if (!canManage) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* 3-Way Match */}
        {poId && grnId && matchStatus !== 'matched' && (
          <button onClick={() => setDialog('run_match')} className="btn-secondary text-sm">
            <Scale size={14} /> Run 3-Way Match
          </button>
        )}

        {/* Approve / Reject */}
        {isPending && canApprove && (
          <>
            <button onClick={() => setDialog('approve')} className="btn-primary text-sm">
              <CheckCircle2 size={14} /> Approve Invoice
            </button>
            <button onClick={() => setDialog('reject')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
              <XCircle size={14} className="inline mr-1" /> Reject
            </button>
          </>
        )}

        {/* Dispute */}
        {(isApproved || isPending) && (
          <button onClick={() => setDialog('dispute')} className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium">
            <Ban size={14} className="inline mr-1" /> Dispute
          </button>
        )}

        {/* Record Payment */}
        {isApproved && isUnpaid && canPay && (
          <button onClick={() => { setPayAmount(String(outstanding)); setDialog('schedule_payment') }}
            className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">
            <CreditCard size={14} className="inline mr-1" /> Record Payment
          </button>
        )}
      </div>

      <ConfirmDialog open={dialog === 'approve'} onClose={() => setDialog(null)}
        title="Approve Invoice" description={`Approve invoice ${invoiceRef} for ₹${totalAmount.toLocaleString()}. This clears it for payment processing.`}
        confirmLabel="Approve" confirmVariant="primary"
        onConfirm={() => updateInvoiceStatus('approved')} />

      <ConfirmDialog open={dialog === 'reject'} onClose={() => setDialog(null)}
        title="Reject Invoice" description={`Reject invoice ${invoiceRef}. Vendor will be notified.`}
        confirmLabel="Reject" confirmVariant="danger" showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateInvoiceStatus('rejected')} />

      <ConfirmDialog open={dialog === 'dispute'} onClose={() => setDialog(null)}
        title="Dispute Invoice" description={`Flag invoice ${invoiceRef} as disputed. Payment will be held until resolution.`}
        confirmLabel="Dispute" confirmVariant="warning" showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateInvoiceStatus('disputed')} />

      <ConfirmDialog open={dialog === 'run_match'} onClose={() => setDialog(null)}
        title="Run 3-Way Match" description={`Compare PO amount, GRN amount, and Invoice amount for ${invoiceRef}. Tolerance: ±1%.`}
        confirmLabel="Run Match" confirmVariant="primary"
        onConfirm={run3WayMatch} />

      {/* Payment Dialog — custom because it has an amount field */}
      {dialog === 'schedule_payment' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDialog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Record Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Invoice {invoiceRef} — Outstanding: ₹{outstanding.toLocaleString()}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Payment Amount (₹)</label>
                <input type="number" step="0.01" min="1" max={outstanding}
                  className="form-input text-lg font-semibold" value={payAmount}
                  onChange={e => setPayAmount(e.target.value)} autoFocus />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPayAmount(String(outstanding))} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Full: ₹{outstanding.toLocaleString()}</button>
                <button onClick={() => setPayAmount(String(Math.round(outstanding / 2)))} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">50%: ₹{Math.round(outstanding / 2).toLocaleString()}</button>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Notes</label>
                <input className="form-input text-sm" value={comment} onChange={e => setComment(e.target.value)} placeholder="Payment reference, UTR number..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDialog(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={recordPayment} className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">
                Record ₹{parseFloat(payAmount || '0').toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
