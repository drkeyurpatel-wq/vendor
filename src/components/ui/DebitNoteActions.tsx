'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Send, XCircle, CreditCard, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'
import { fireNotification } from '@/lib/notifications'

interface Props {
  debitNoteId: string
  dnNumber: string
  status: string
  amount: number
  vendorName?: string
  userRole: string
}

export default function DebitNoteActions({ debitNoteId, dnNumber, status, amount, vendorName, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const canApprove = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)
  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)

  async function handleAction(action: string) {
    setLoading(true)
    try {
      let updates: Record<string, any> = { updated_at: new Date().toISOString() }

      switch (action) {
        case 'approve':
          updates.status = 'approved'
          updates.approved_at = new Date().toISOString()
          break
        case 'send':
          updates.status = 'sent'
          updates.sent_at = new Date().toISOString()
          break
        case 'adjust':
          updates.status = 'adjusted'
          updates.adjusted_at = new Date().toISOString()
          if (comment) updates.adjustment_notes = comment
          break
        case 'cancel':
          updates.status = 'cancelled'
          updates.cancelled_at = new Date().toISOString()
          if (comment) updates.cancellation_reason = comment
          break
      }

      const { error } = await supabase.from('debit_notes').update(updates).eq('id', debitNoteId)
      if (error) throw error

      toast.success(`${dnNumber} → ${action}`)
      fireNotification({
        action: `debit_note_${action}`,
        entity_type: 'debit_note',
        entity_id: debitNoteId,
        details: { dn_number: dnNumber, vendor: vendorName, amount },
      })

      setConfirmAction(null); setComment(''); router.refresh()
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action}`)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {status === 'draft' && canApprove && (
          <button onClick={() => setConfirmAction('approve')} disabled={loading}
            className="btn-primary text-xs flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Approve
          </button>
        )}
        {status === 'approved' && canManage && (
          <button onClick={() => setConfirmAction('send')} disabled={loading}
            className="btn-primary text-xs flex items-center gap-1.5">
            <Send size={13} /> Send to Vendor
          </button>
        )}
        {status === 'sent' && canManage && (
          <button onClick={() => setConfirmAction('adjust')} disabled={loading}
            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1.5">
            <CreditCard size={13} /> Mark Adjusted
          </button>
        )}
        {!['adjusted', 'cancelled'].includes(status) && canApprove && (
          <button onClick={() => setConfirmAction('cancel')} disabled={loading}
            className="btn-danger text-xs flex items-center gap-1.5">
            <XCircle size={13} /> Cancel
          </button>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          open={true}
          onClose={() => { setConfirmAction(null); setComment('') }}
          title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} Debit Note ${dnNumber}`}
          description={
            confirmAction === 'approve' ? `Approve debit note for ₹${amount.toLocaleString('en-IN')} against ${vendorName || 'vendor'}.` :
            confirmAction === 'send' ? `Send this debit note to ${vendorName || 'vendor'}. They will be notified.` :
            confirmAction === 'adjust' ? 'Mark this debit note as adjusted — the vendor has credited the amount.' :
            'Cancel this debit note. This cannot be undone.'
          }
          confirmLabel={confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
          confirmVariant={confirmAction === 'cancel' ? 'danger' : 'primary'}
          showCommentBox={confirmAction === 'cancel' || confirmAction === 'adjust'}
          requireComment={confirmAction === 'cancel'}
          comment={comment}
          onCommentChange={setComment}
          onConfirm={() => handleAction(confirmAction)}
        />
      )}
    </>
  )
}
