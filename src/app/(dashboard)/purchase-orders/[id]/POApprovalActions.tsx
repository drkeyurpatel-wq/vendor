'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { canApprovePO } from '@/types/database'
import type { UserRole } from '@/types/database'

interface Props {
  poId: string
  poStatus: string
  totalAmount: number
  userRole: UserRole
  userId: string
}

export default function POApprovalActions({ poId, poStatus, totalAmount, userRole, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState('')

  const showApprove = poStatus === 'pending_approval' && canApprovePO(userRole, totalAmount)
  const showSend = poStatus === 'approved' && ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  const showCancel = ['draft', 'pending_approval'].includes(poStatus) && ['group_admin', 'unit_purchase_manager'].includes(userRole)

  async function handleAction(action: 'approve' | 'reject' | 'send' | 'cancel') {
    setLoading(true)
    try {
      if (action === 'approve') {
        await supabase.from('po_approvals')
          .update({ status: 'approved', approver_id: userId, actioned_at: new Date().toISOString(), comments: comments.trim() || null })
          .eq('po_id', poId)
          .eq('status', 'pending')
        await supabase.from('purchase_orders').update({ status: 'approved', approved_by: userId, approved_at: new Date().toISOString() }).eq('id', poId)
        toast.success('PO approved')
      } else if (action === 'reject') {
        if (!comments.trim()) { toast.error('Please add rejection comments'); setLoading(false); return }
        await supabase.from('po_approvals')
          .update({ status: 'rejected', approver_id: userId, actioned_at: new Date().toISOString(), comments: comments.trim() })
          .eq('po_id', poId)
          .eq('status', 'pending')
        await supabase.from('purchase_orders').update({ status: 'cancelled', cancellation_reason: comments.trim() }).eq('id', poId)
        toast.success('PO rejected')
      } else if (action === 'send') {
        await supabase.from('purchase_orders').update({ status: 'sent_to_vendor' }).eq('id', poId)
        toast.success('PO sent to vendor')
      } else if (action === 'cancel') {
        await supabase.from('purchase_orders').update({ status: 'cancelled' }).eq('id', poId)
        toast.success('PO cancelled')
      }
      router.refresh()
    } catch {
      toast.error('Action failed')
    }
    setLoading(false)
  }

  if (!showApprove && !showSend && !showCancel) return null

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Actions</h2>

      {showApprove && (
        <div className="space-y-3">
          <textarea
            className="form-input w-full"
            rows={2}
            placeholder="Comments (required for rejection)..."
            value={comments}
            onChange={e => setComments(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => handleAction('approve')} disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approve
            </button>
            <button onClick={() => handleAction('reject')} disabled={loading} className="btn-danger flex-1">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Reject
            </button>
          </div>
        </div>
      )}

      {showSend && (
        <button onClick={() => handleAction('send')} disabled={loading} className="btn-primary w-full">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send to Vendor
        </button>
      )}

      {showCancel && (
        <button onClick={() => handleAction('cancel')} disabled={loading} className="btn-danger w-full mt-3">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Cancel PO
        </button>
      )}
    </div>
  )
}
