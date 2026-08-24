'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatCurrency } from '@/lib/utils'
import type { UserRole } from '@/types/database'

interface PendingPO {
  id: string
  po_number: string | null
  po_date: string | null
  total_amount: number
  priority: string | null
  vendor: { legal_name: string } | null
  centre: { code: string; name: string } | null
}

export default function ApprovalsClient({ pos, role }: { pos: PendingPO[]; role: UserRole }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [comments, setComments] = useState('')

  async function act(poId: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !comments.trim()) {
      toast.error('Add a reason before rejecting')
      return
    }
    setBusyId(poId)
    try {
      const res = await fetch('/api/po/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_id: poId, action, comments: comments.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Action failed')
      } else {
        toast.success(json.message || (action === 'approve' ? 'Approved' : 'Rejected'))
        setRejectId(null)
        setComments('')
        router.refresh()
      }
    } catch {
      toast.error('Action failed — please retry')
    }
    setBusyId(null)
  }

  if (pos.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Approvals</h1>
        <div className="mt-10 flex flex-col items-center text-center py-16 px-6 bg-white rounded-2xl border border-gray-200">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
            <ShieldCheck size={26} className="text-teal-600" aria-hidden="true" />
          </div>
          <p className="text-base font-semibold text-navy-600">Nothing waiting on you</p>
          <p className="text-sm text-gray-500 mt-1.5 max-w-sm">
            Purchase orders needing your approval will appear here. You can still browse
            everything under Purchase Orders.
          </p>
          <Link href="/purchase-orders" className="btn-secondary mt-5">View all purchase orders</Link>
        </div>
      </div>
    )
  }

  const total = pos.reduce((s, p) => s + (p.total_amount || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pos.length} purchase order{pos.length === 1 ? '' : 's'} awaiting your approval
          {' · '}{formatCurrency(total)} total
        </p>
      </div>

      <div className="space-y-3">
        {pos.map(po => {
          const busy = busyId === po.id
          const rejecting = rejectId === po.id
          return (
            <div key={po.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/purchase-orders/${po.id}`} className="font-semibold text-navy-600 hover:underline">
                      {po.po_number || 'Draft PO'}
                    </Link>
                    {po.priority && ['urgent', 'emergency'].includes(po.priority) && (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-red-50 text-red-700 border border-red-200">
                        {po.priority}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {po.vendor?.legal_name || 'Vendor not set'}
                    {po.centre?.code ? ` · ${po.centre.code}` : ''}
                    {po.po_date ? ` · ${new Date(po.po_date).toLocaleDateString('en-IN')}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-bold text-navy-600 tabular-nums">
                    {formatCurrency(po.total_amount)}
                  </span>
                  <button
                    onClick={() => act(po.id, 'approve')}
                    disabled={busy}
                    className={cn('btn-primary', busy && 'opacity-60 cursor-not-allowed')}
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectId(rejecting ? null : po.id); setComments('') }}
                    disabled={busy}
                    className="btn-secondary"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>

              {rejecting && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label htmlFor={`reason-${po.id}`} className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reason for rejection
                  </label>
                  <textarea
                    id={`reason-${po.id}`}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-600/30"
                    placeholder="This is recorded against the PO and shown to the purchase team"
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button onClick={() => act(po.id, 'reject')} disabled={busy} className="btn-primary">
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Confirm rejection
                    </button>
                    <button onClick={() => { setRejectId(null); setComments('') }} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
