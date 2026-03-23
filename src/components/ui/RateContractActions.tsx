'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Clock, RotateCcw, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  contractId: string
  contractNumber: string
  currentStatus: string
  vendorId: string
  userRole: string
}

type DialogType = 'activate' | 'expire' | 'terminate' | null

export default function RateContractActions({ contractId, contractNumber, currentStatus, vendorId, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [comment, setComment] = useState('')

  const canManage = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)
  const isDraft = currentStatus === 'draft'
  const isActive = currentStatus === 'active'
  const isExpired = currentStatus === 'expired'
  const isTerminated = currentStatus === 'terminated'

  async function updateStatus(newStatus: string) {
    const updates: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'active') updates.approved_at = new Date().toISOString()
    if (newStatus === 'terminated') updates.termination_reason = comment || null

    const { error } = await supabase.from('rate_contracts').update(updates).eq('id', contractId)
    if (error) { toast.error(error.message); return }

    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'rate_contract', entity_id: contractId,
        action: `contract_${newStatus}`,
        details: { contract_number: contractNumber, comment: comment || null },
      })
    } catch {}

    toast.success(`Contract ${contractNumber} → ${newStatus}`)
    setDialog(null); setComment(''); router.refresh()
  }

  async function duplicateContract() {
    const { data: original } = await supabase.from('rate_contracts')
      .select('vendor_id, centre_id, valid_from, valid_to, payment_terms, notes')
      .eq('id', contractId).single()
    if (!original) { toast.error('Could not fetch contract'); return }

    const { data: items } = await supabase.from('rate_contract_items')
      .select('item_id, rate, min_qty, max_qty, l_rank')
      .eq('rate_contract_id', contractId)

    const newNum = `${contractNumber}-RENEW`
    const today = new Date().toISOString().split('T')[0]
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]

    const { data: newContract, error } = await supabase.from('rate_contracts').insert({
      ...original, contract_number: newNum, status: 'draft',
      valid_from: today, valid_to: nextYear,
      notes: `Renewed from ${contractNumber}`,
    }).select('id').single()

    if (error || !newContract) { toast.error(error?.message || 'Failed'); return }

    if (items && items.length > 0) {
      await supabase.from('rate_contract_items').insert(
        items.map(i => ({ ...i, rate_contract_id: newContract.id }))
      )
    }

    toast.success(`Renewed → ${newNum}`)
    router.push(`/settings/rate-contracts/${newContract.id}`)
  }

  if (!canManage) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <button onClick={() => setDialog('activate')} className="btn-primary text-sm">
            <CheckCircle2 size={14} /> Activate Contract
          </button>
        )}

        {isActive && (
          <button onClick={() => setDialog('expire')} className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium">
            <Clock size={14} className="inline mr-1" /> Expire Early
          </button>
        )}

        {(isActive || isDraft) && (
          <button onClick={() => setDialog('terminate')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
            <XCircle size={14} className="inline mr-1" /> Terminate
          </button>
        )}

        {(isExpired || isTerminated) && (
          <button onClick={duplicateContract} className="btn-secondary text-sm">
            <RotateCcw size={14} /> Renew (duplicate as draft)
          </button>
        )}

        <button onClick={duplicateContract} className="btn-secondary text-sm">
          <Copy size={14} /> Duplicate
        </button>
      </div>

      <ConfirmDialog open={dialog === 'activate'} onClose={() => setDialog(null)}
        title="Activate Rate Contract" description={`Activate ${contractNumber}. Rates will be enforced on new POs for this vendor.`}
        confirmLabel="Activate" confirmVariant="primary"
        onConfirm={() => updateStatus('active')} />

      <ConfirmDialog open={dialog === 'expire'} onClose={() => setDialog(null)}
        title="Expire Contract Early" description={`Mark ${contractNumber} as expired immediately. New POs won't enforce these rates.`}
        confirmLabel="Expire" confirmVariant="warning"
        showCommentBox comment={comment} onCommentChange={setComment}
        onConfirm={() => updateStatus('expired')} />

      <ConfirmDialog open={dialog === 'terminate'} onClose={() => setDialog(null)}
        title="Terminate Contract" description={`Terminate ${contractNumber}. This is a stronger action than expiry — typically used for breach of terms.`}
        confirmLabel="Terminate" confirmVariant="danger"
        showCommentBox requireComment comment={comment} onCommentChange={setComment}
        onConfirm={() => updateStatus('terminated')} />
    </>
  )
}
