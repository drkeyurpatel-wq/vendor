'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Truck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  transferId: string
  transferNumber: string
  currentStatus: string
  userRole: string
}

type DialogType = 'approve' | 'reject' | 'receive' | 'cancel' | null

export default function TransferActions({ transferId, transferNumber, currentStatus, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')

  const canApprove = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)
  const canReceive = ['group_admin', 'unit_cao', 'unit_purchase_manager', 'store_staff'].includes(userRole)
  const isDraft = currentStatus === 'draft'
  const isApproved = currentStatus === 'approved'
  const isInTransit = currentStatus === 'in_transit'

  async function updateStatus(newStatus: string) {
    const { error } = await supabase.from('stock_transfers').update({
      status: newStatus,
      ...(newStatus === 'approved' ? { approved_at: new Date().toISOString() } : {}),
      ...(newStatus === 'received' ? { received_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', transferId)

    if (error) { toast.error(error.message); return }
    try { await supabase.from('audit_logs').insert({ entity_type: 'stock_transfer', entity_id: transferId, action: `transfer_${newStatus}`, details: { transfer_number: transferNumber, comment: comment || null } }) } catch {}
    toast.success(`Transfer ${transferNumber} → ${newStatus.replace(/_/g, ' ')}`)
    setDialog(null); setComment(''); router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isDraft && canApprove && (
          <button onClick={() => setDialog('approve')} className="btn-primary text-sm"><CheckCircle2 size={14} /> Approve</button>
        )}
        {(isApproved || isInTransit) && canReceive && (
          <button onClick={() => setDialog('receive')} className="text-sm px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">
            <Truck size={14} className="inline mr-1" /> Mark Received
          </button>
        )}
        {isDraft && canApprove && (
          <button onClick={() => setDialog('reject')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
            <XCircle size={14} className="inline mr-1" /> Reject
          </button>
        )}
        {!['received', 'cancelled'].includes(currentStatus) && canApprove && (
          <button onClick={() => setDialog('cancel')} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
        )}
      </div>

      <ConfirmDialog open={dialog === 'approve'} onClose={() => setDialog(null)} title="Approve Transfer" description={`Approve ${transferNumber} for dispatch.`} confirmLabel="Approve" confirmVariant="primary" onConfirm={() => updateStatus('approved')} />
      <ConfirmDialog open={dialog === 'receive'} onClose={() => setDialog(null)} title="Mark Received" description={`Confirm goods from ${transferNumber} have been received and counted at destination.`} confirmLabel="Received" confirmVariant="primary" showCommentBox comment={comment} onCommentChange={setComment} onConfirm={() => updateStatus('received')} />
      <ConfirmDialog open={dialog === 'reject'} onClose={() => setDialog(null)} title="Reject Transfer" description={`Reject ${transferNumber}.`} confirmLabel="Reject" confirmVariant="danger" showCommentBox requireComment comment={comment} onCommentChange={setComment} onConfirm={() => updateStatus('rejected')} />
      <ConfirmDialog open={dialog === 'cancel'} onClose={() => setDialog(null)} title="Cancel Transfer" description={`Cancel ${transferNumber}.`} confirmLabel="Cancel" confirmVariant="danger" showCommentBox requireComment comment={comment} onCommentChange={setComment} onConfirm={() => updateStatus('cancelled')} />
    </>
  )
}
