'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, RefreshCcw, Calendar, Loader2, Copy, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  contractId: string
  contractNumber?: string
  status: string
  endDate?: string
  vendorName?: string
  userRole: string
  /** If true, render compact inline buttons. Otherwise, render full action bar. */
  compact?: boolean
}

export default function RateContractActions({ contractId, contractNumber, status, endDate, vendorName, userRole, compact }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [extendDate, setExtendDate] = useState('')

  const canManage = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)
  if (!canManage) return null

  async function handleAction(action: string) {
    setLoading(true)
    try {
      let updates: Record<string, any> = { updated_at: new Date().toISOString() }

      switch (action) {
        case 'activate':
          updates.status = 'active'
          updates.approved_at = new Date().toISOString()
          break
        case 'terminate':
          updates.status = 'terminated'
          
          if (comment) updates.termination_reason = comment
          break
        case 'extend':
          if (!extendDate) { toast.error('Select new end date'); setLoading(false); return }
          updates.valid_to = extendDate
          
          break
        case 'renew':
          // Create new contract as draft, copy from current
          const { data: original } = await supabase.from('rate_contracts')
            .select('*, items:rate_contract_items(*)')
            .eq('id', contractId).single()
          if (!original) { toast.error('Contract not found'); setLoading(false); return }

          const newStart = original.valid_to || new Date().toISOString().split('T')[0]
          const startDate = new Date(newStart)
          const newEnd = new Date(startDate)
          if (original.contract_type === 'annual') newEnd.setFullYear(newEnd.getFullYear() + 1)
          else if (original.contract_type === 'quarterly') newEnd.setMonth(newEnd.getMonth() + 3)
          else newEnd.setMonth(newEnd.getMonth() + 1)

          const { data: newContract, error: createErr } = await supabase.from('rate_contracts').insert({
            vendor_id: original.vendor_id, centre_id: original.centre_id,
            contract_type: original.contract_type, status: 'draft',
            valid_from: newStart, valid_to: newEnd.toISOString().split('T')[0],
          }).select('id').single()

          if (createErr || !newContract) throw createErr || new Error('Failed')

          // Copy items
          if (original.items?.length) {
            const newItems = original.items.map((item: any) => ({
              contract_id: newContract.id, item_id: item.item_id,
              rate: item.rate, l_rank: item.l_rank,
              min_qty: item.min_qty, max_qty: item.max_qty,
            }))
            await supabase.from('rate_contract_items').insert(newItems)
          }

          toast.success('Renewal contract created as draft')
          router.push(`/settings/rate-contracts/${newContract.id}`)
          setLoading(false); setConfirmAction(null)
          return
      }

      const { error } = await supabase.from('rate_contracts').update(updates).eq('id', contractId)
      if (error) throw error

      toast.success(`Contract → ${action}`)
      setConfirmAction(null); setComment(''); setExtendDate(''); router.refresh()
    } catch (err: any) { toast.error(err?.message || `Failed to ${action}`) }
    finally { setLoading(false) }
  }

  if (compact) {
    return (
      <div className="flex gap-1.5">
        {status === 'draft' && (
          <button onClick={() => setConfirmAction('activate')}
            className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium">
            <CheckCircle2 size={10} className="inline mr-0.5" /> Activate
          </button>
        )}
        {status === 'active' && (
          <>
            <button onClick={() => setConfirmAction('extend')}
              className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">
              <Calendar size={10} className="inline mr-0.5" /> Extend
            </button>
            <button onClick={() => setConfirmAction('terminate')}
              className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium">
              <XCircle size={10} className="inline mr-0.5" /> Terminate
            </button>
          </>
        )}
        {['expired', 'terminated'].includes(status) && (
          <button onClick={() => setConfirmAction('renew')}
            className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium">
            <RefreshCcw size={10} className="inline mr-0.5" /> Renew
          </button>
        )}
        {/* Inline confirm modals shared below */}
        {renderConfirm()}
      </div>
    )
  }

  // Full action bar (for detail page)
  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {status === 'draft' && (
          <>
            <button onClick={() => setConfirmAction('activate')} disabled={loading} className="btn-primary text-xs flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Activate Contract
            </button>
            <a href={`/settings/rate-contracts/${contractId}`} className="btn-secondary text-xs flex items-center gap-1.5">
              <Edit size={13} /> Edit
            </a>
          </>
        )}
        {status === 'active' && (
          <>
            <button onClick={() => setConfirmAction('extend')} disabled={loading} className="btn-primary text-xs flex items-center gap-1.5">
              <Calendar size={13} /> Extend
            </button>
            <button onClick={() => setConfirmAction('terminate')} disabled={loading} className="btn-danger text-xs flex items-center gap-1.5">
              <XCircle size={13} /> Terminate
            </button>
          </>
        )}
        {['expired', 'terminated'].includes(status) && (
          <button onClick={() => setConfirmAction('renew')} disabled={loading} className="btn-primary text-xs flex items-center gap-1.5">
            <RefreshCcw size={13} /> Renew Contract
          </button>
        )}
      </div>
      {renderConfirm()}
    </>
  )

  function renderConfirm() {
    if (!confirmAction) return null

    if (confirmAction === 'extend') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setConfirmAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-navy-600">Extend Contract</h3>
            <p className="text-xs text-gray-500">Current end: {endDate || 'N/A'} · {vendorName}</p>
            <div>
              <label className="form-label">New End Date</label>
              <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                min={endDate || new Date().toISOString().split('T')[0]} className="form-input text-sm" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={() => handleAction('extend')} disabled={loading || !extendDate} className="btn-primary text-xs">
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Extend'}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <ConfirmDialog
        open={true}
        onClose={() => { setConfirmAction(null); setComment('') }}
        title={`${confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)} Contract`}
        description={
          confirmAction === 'activate' ? `Activate this rate contract for ${vendorName || 'vendor'}. PO rates will be validated against contract rates.` :
          confirmAction === 'terminate' ? `Terminate this rate contract. POs will no longer be validated against these rates.` :
          `Create a renewal contract as draft, copying all items and rates from the current contract.`
        }
        confirmLabel={confirmAction.charAt(0).toUpperCase() + confirmAction.slice(1)}
        confirmVariant={confirmAction === 'terminate' ? 'danger' : 'primary'}
        showCommentBox={confirmAction === 'terminate'}
        requireComment={confirmAction === 'terminate'}
        comment={comment}
        onCommentChange={setComment}
        onConfirm={() => handleAction(confirmAction)}
      />
    )
  }
}
