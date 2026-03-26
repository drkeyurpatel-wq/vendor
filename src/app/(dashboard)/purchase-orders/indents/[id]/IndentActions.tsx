'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Send, ShoppingCart, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { fireNotification } from '@/lib/notifications'

interface Props {
  indentId: string
  indentNumber: string
  currentStatus: string
  centreId: string
  userRole: string
}

type DialogType = 'submit' | 'approve' | 'reject' | null

export default function IndentActions({ indentId, indentNumber, currentStatus, centreId, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = currentStatus === 'draft'
  const canApprove = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole) && currentStatus === 'submitted'
  const canReject = canApprove
  const canConvert = currentStatus === 'approved'

  async function updateStatus(newStatus: string) {
    setLoading(true)
    const updates: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'approved') {
      const { data: { user } } = await supabase.auth.getUser()
      updates.approved_by = user?.id
      updates.approved_at = new Date().toISOString()
    }

    const { error } = await supabase.from('purchase_indents').update(updates).eq('id', indentId)
    if (error) { toast.error(error.message); setLoading(false); return }

    try {
      await supabase.from('activity_log').insert({
        entity_type: 'purchase_indent', entity_id: indentId,
        action: `indent_${newStatus}`,
        details: { indent_number: indentNumber, comment: comment || null },
      })
    } catch {}

    toast.success(`${indentNumber} → ${newStatus.replace(/_/g, ' ')}`)
    fireNotification({ action: `indent_${newStatus}`, entity_type: 'purchase_indent', entity_id: indentId, details: { indent_number: indentNumber } })
    setDialog(null); setComment(''); setLoading(false); router.refresh()
  }

  async function convertToPO() {
    // Try smart conversion via API (auto-assigns L1 vendors)
    setLoading(true)
    try {
      const res = await fetch('/api/indent/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indent_id: indentId }),
      })
      const data = await res.json()
      if (res.ok && data.po_id) {
        toast.success(`PO ${data.po_number} created from ${indentNumber}`)
        router.push(`/purchase-orders/${data.po_id}`)
        return
      }
      // Fallback: manual PO creation
      toast('Auto-conversion unavailable. Redirecting to manual PO form.', { icon: '📋' })
    } catch {}
    setLoading(false)
    router.push(`/purchase-orders/new?indent=${indentId}`)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canSubmit && (
          <button onClick={() => setDialog('submit')} className="btn-primary text-sm">
            <Send size={14} /> Submit for Approval
          </button>
        )}
        {canApprove && (
          <button onClick={() => setDialog('approve')} className="btn-primary text-sm">
            <CheckCircle2 size={14} /> Approve
          </button>
        )}
        {canReject && (
          <button onClick={() => setDialog('reject')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
            <XCircle size={14} className="inline mr-1" /> Reject
          </button>
        )}
        {canConvert && (
          <button onClick={convertToPO} className="text-sm px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-medium flex items-center gap-1.5">
            <ShoppingCart size={14} /> Convert to PO
          </button>
        )}
      </div>

      <ConfirmDialog open={dialog === 'submit'} onClose={() => setDialog(null)} title="Submit Indent" description={`Submit ${indentNumber} for approval.`} confirmLabel="Submit" confirmVariant="primary" onConfirm={() => updateStatus('submitted')} />
      <ConfirmDialog open={dialog === 'approve'} onClose={() => setDialog(null)} title="Approve Indent" description={`Approve ${indentNumber}. It can then be converted to a Purchase Order.`} confirmLabel="Approve" confirmVariant="primary" onConfirm={() => updateStatus('approved')} />
      <ConfirmDialog open={dialog === 'reject'} onClose={() => setDialog(null)} title="Reject Indent" description={`Reject ${indentNumber}.`} confirmLabel="Reject" confirmVariant="danger" showCommentBox requireComment comment={comment} onCommentChange={setComment} onConfirm={() => updateStatus('rejected')} />
    </>
  )
}
