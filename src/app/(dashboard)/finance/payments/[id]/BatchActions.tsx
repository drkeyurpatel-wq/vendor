'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Banknote, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { trackChanges } from '@/lib/audit-trail'

interface Props {
  batchId: string
  batchNumber: string
  status: string
  totalAmount: number
  paymentStatus?: string
  totalAmount2?: number
  paidAmount?: number
}

export default function BatchActions({ batchId, batchNumber, status, totalAmount }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [utrNumber, setUtrNumber] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  async function approveBatch() {
    setLoading('approve')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('payment_batches').update({
      status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString(),
    }).eq('id', batchId)
    trackChanges({ entity_type: 'payment_batch', entity_id: batchId, changes: { status: { old: status, new: 'approved' } } })
    toast.success(`Batch ${batchNumber} approved`)
    setLoading(null)
    router.refresh()
  }

  async function markPaid() {
    if (!utrNumber.trim()) { toast.error('Enter UTR / reference number'); return }
    setLoading('pay')
    const { data: { user } } = await supabase.auth.getUser()

    // Update batch
    await supabase.from('payment_batches').update({
      status: 'paid', paid_by: user?.id, paid_at: new Date().toISOString(),
      payment_date: new Date().toISOString().split('T')[0],
    }).eq('id', batchId)

    // Update all batch items with UTR
    await supabase.from('payment_batch_items').update({
      utr_number: utrNumber.trim(), reference_number: utrNumber.trim(),
      status: 'completed', payment_date: new Date().toISOString().split('T')[0],
    }).eq('batch_id', batchId)

    // Update each invoice's paid_amount and payment_status
    const { data: items } = await supabase.from('payment_batch_items')
      .select('invoice_id, net_payable, amount, tds_amount')
      .eq('batch_id', batchId)

    for (const item of (items || [])) {
      const paidAmount = item.net_payable || item.amount || 0
      const { data: inv } = await supabase.from('invoices')
        .select('total_amount, paid_amount, tds_amount')
        .eq('id', item.invoice_id).single()

      if (inv) {
        const newPaid = (inv.paid_amount || 0) + paidAmount
        const newTds = (inv.tds_amount || 0) + (item.tds_amount || 0)
        const fullyPaid = newPaid + newTds >= (inv.total_amount || 0) * 0.98 // 2% tolerance
        await supabase.from('invoices').update({
          paid_amount: newPaid,
          tds_amount: newTds,
          payment_status: fullyPaid ? 'paid' : 'partial',
        }).eq('id', item.invoice_id)
      }
    }

    trackChanges({ entity_type: 'payment_batch', entity_id: batchId, changes: {
      status: { old: 'approved', new: 'paid' },
      utr_number: { old: null, new: utrNumber.trim() },
    } })

    toast.success(`Batch ${batchNumber} marked paid — UTR: ${utrNumber.trim()}`)
    setLoading(null)
    setShowPay(false)
    router.refresh()
  }

  async function rejectBatch() {
    if (!rejectReason.trim()) { toast.error('Enter rejection reason'); return }
    setLoading('reject')
    await supabase.from('payment_batches').update({
      status: 'rejected', notes: rejectReason.trim(),
    }).eq('id', batchId)

    // Unlink invoices
    const { data: items } = await supabase.from('payment_batch_items').select('invoice_id').eq('batch_id', batchId)
    for (const item of (items || [])) {
      await supabase.from('invoices').update({ payment_batch_id: null }).eq('id', item.invoice_id)
    }

    trackChanges({ entity_type: 'payment_batch', entity_id: batchId, changes: { status: { old: status, new: 'rejected' } } })
    toast.success(`Batch ${batchNumber} rejected`)
    setLoading(null)
    setShowReject(false)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {status === 'pending_approval' && (
          <>
            <button onClick={approveBatch} disabled={!!loading}
              className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium flex items-center gap-1.5">
              {loading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve Batch
            </button>
            <button onClick={() => setShowReject(!showReject)} disabled={!!loading}
              className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center gap-1.5">
              <XCircle size={14} /> Reject
            </button>
          </>
        )}
        {status === 'approved' && (
          <button onClick={() => setShowPay(!showPay)} disabled={!!loading}
            className="text-sm px-4 py-2 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#152d54] font-medium flex items-center gap-1.5">
            <Banknote size={14} /> Mark as Paid — {formatCurrency(totalAmount)}
          </button>
        )}
        {status === 'paid' && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircle2 size={16} />
            <span className="font-medium text-sm">Payment completed</span>
          </div>
        )}
      </div>

      {/* Mark Paid form */}
      {showPay && (
        <div className="card p-4 border-2 border-[#1B3A6B]">
          <h3 className="font-semibold text-sm text-[#1B3A6B] mb-3">Enter Payment Reference</h3>
          <div className="flex gap-3">
            <input className="form-input flex-1" placeholder="UTR number / cheque number / reference..."
              value={utrNumber} onChange={e => setUtrNumber(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') markPaid() }} autoFocus />
            <button onClick={markPaid} disabled={loading === 'pay' || !utrNumber.trim()}
              className="btn-primary text-sm whitespace-nowrap">
              {loading === 'pay' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Confirm Payment
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">This will update all invoice paid amounts and mark them as paid/partial.</p>
        </div>
      )}

      {/* Reject form */}
      {showReject && (
        <div className="card p-4 border-2 border-red-200">
          <h3 className="font-semibold text-sm text-red-600 mb-3">Rejection Reason</h3>
          <div className="flex gap-3">
            <input className="form-input flex-1" placeholder="Reason for rejecting this batch..."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') rejectBatch() }} autoFocus />
            <button onClick={rejectBatch} disabled={loading === 'reject' || !rejectReason.trim()}
              className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">
              {loading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
