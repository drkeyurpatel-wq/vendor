'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Truck, CheckCircle2, XCircle, Loader2, ArrowRightLeft, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: 'text-blue-800', bg: 'bg-blue-100' },
  dispatched: { label: 'Dispatched — awaiting receiver', color: 'text-amber-800', bg: 'bg-amber-100' },
  received: { label: 'Received — stock moved', color: 'text-green-800', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-800', bg: 'bg-red-100' },
}

export default function TransferDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [transfer, setTransfer] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [dialog, setDialog] = useState<'dispatch' | 'receive' | 'cancel' | null>(null)

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from('stock_transfers')
        .select(`*, 
          from_sub:sub_stores!stock_transfers_from_sub_store_id_fkey(id, code, name, centre:centres(code, name)),
          to_sub:sub_stores!stock_transfers_to_sub_store_id_fkey(id, code, name, centre:centres(code, name)),
          creator:user_profiles!stock_transfers_created_by_fkey(full_name),
          receiver:user_profiles!stock_transfers_received_by_fkey(full_name)
        `)
        .eq('id', id)
        .single()

      if (t) setTransfer(t)

      const { data: tItems } = await supabase
        .from('stock_transfer_items')
        .select('*, item:items(item_code, generic_name, unit)')
        .eq('transfer_id', id)

      setItems(tItems || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleAction(action: 'dispatch' | 'receive' | 'cancel') {
    setActing(true)
    try {
      const payload: any = { transfer_id: id, action }

      // For receive: pass received_qty per item (default = dispatched)
      if (action === 'receive') {
        payload.items = items.map(i => ({
          id: i.id,
          received_qty: i.received_qty > 0 ? i.received_qty : i.dispatched_qty,
        }))
      }

      const res = await fetch('/api/sub-store/transfer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Action failed'); setActing(false); return }

      toast.success(data.message)
      setDialog(null)
      router.refresh()
      // Reload data
      const { data: updated } = await supabase.from('stock_transfers').select('*').eq('id', id).single()
      if (updated) setTransfer(updated)
      const { data: updatedItems } = await supabase.from('stock_transfer_items')
        .select('*, item:items(item_code, generic_name, unit)').eq('transfer_id', id)
      setItems(updatedItems || [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed')
    }
    setActing(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-navy-600" /></div>
  }

  if (!transfer) {
    return <div className="text-center py-20 text-gray-500">Transfer not found</div>
  }

  const fromSub = Array.isArray(transfer.from_sub) ? transfer.from_sub[0] : transfer.from_sub
  const toSub = Array.isArray(transfer.to_sub) ? transfer.to_sub[0] : transfer.to_sub
  const fromCentre = fromSub?.centre && (Array.isArray(fromSub.centre) ? fromSub.centre[0] : fromSub.centre)
  const toCentre = toSub?.centre && (Array.isArray(toSub.centre) ? toSub.centre[0] : toSub.centre)
  const creator = Array.isArray(transfer.creator) ? transfer.creator[0] : transfer.creator
  const receiver = Array.isArray(transfer.receiver) ? transfer.receiver[0] : transfer.receiver
  const status = STATUS_CONFIG[transfer.status] || STATUS_CONFIG.requested

  return (
    <div className="max-w-4xl">
      <Link href="/inventory/sub-store/transfer" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Transfers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{transfer.transfer_number}</h1>
          <p className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}>
            {status.label}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {transfer.status === 'requested' && (
            <>
              <button onClick={() => setDialog('dispatch')} disabled={acting} className="btn-primary text-sm">
                <Truck size={14} /> Dispatch
              </button>
              <button onClick={() => setDialog('cancel')} disabled={acting}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
                <XCircle size={14} className="inline mr-1" /> Cancel
              </button>
            </>
          )}
          {transfer.status === 'dispatched' && (
            <button onClick={() => setDialog('receive')} disabled={acting} className="btn-primary text-sm">
              <CheckCircle2 size={14} /> Confirm Receipt
            </button>
          )}
        </div>
      </div>

      {/* Transfer info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-semibold">From</div>
          <div className="text-lg font-bold text-gray-900">{fromSub?.name || '—'}</div>
          <div className="text-sm text-gray-500">{fromCentre?.name} ({fromCentre?.code})</div>
          {creator && <div className="text-xs text-gray-400 mt-2">Created by: {creator.full_name}</div>}
          <div className="text-xs text-gray-400">Date: {formatDate(transfer.transfer_date)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 font-semibold">To</div>
          <div className="text-lg font-bold text-gray-900">{toSub?.name || '—'}</div>
          <div className="text-sm text-gray-500">{toCentre?.name} ({toCentre?.code})</div>
          {receiver && <div className="text-xs text-gray-400 mt-2">Received by: {receiver.full_name}</div>}
          {transfer.received_at && <div className="text-xs text-gray-400">Received: {formatDate(transfer.received_at)}</div>}
        </div>
      </div>

      {transfer.notes && (
        <div className="card p-4 mb-6 bg-gray-50">
          <div className="text-xs text-gray-500 font-semibold mb-1">Notes</div>
          <div className="text-sm text-gray-700">{transfer.notes}</div>
        </div>
      )}

      {/* Items table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b bg-navy-50">
          <h2 className="text-sm font-semibold text-navy-700">Transfer Items ({items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Item</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600">Unit</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600">Requested</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600">Dispatched</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-600">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item: any) => {
                const it = Array.isArray(item.item) ? item.item[0] : item.item
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-gray-500">{it?.item_code}</div>
                      <div className="text-sm font-medium text-gray-900">{it?.generic_name}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{item.unit || it?.unit || '—'}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium">{item.requested_qty}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {item.dispatched_qty > 0 ? item.dispatched_qty : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {item.received_qty > 0 ? (
                        <span className={item.received_qty < item.dispatched_qty ? 'text-amber-600' : 'text-green-600'}>
                          {item.received_qty}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog open={dialog === 'dispatch'} onClose={() => setDialog(null)}
        title="Dispatch Transfer" description={`Confirm that ${items.length} items have been physically sent from ${fromSub?.name} to ${toSub?.name}. Stock will be deducted from ${fromSub?.name} immediately.`}
        confirmLabel="Dispatch" confirmVariant="primary"
        onConfirm={() => handleAction('dispatch')} />

      <ConfirmDialog open={dialog === 'receive'} onClose={() => setDialog(null)}
        title="Confirm Receipt" description={`Confirm that items have been received at ${toSub?.name}. Stock will be added to ${toSub?.name}.`}
        confirmLabel="Confirm Received" confirmVariant="primary"
        onConfirm={() => handleAction('receive')} />

      <ConfirmDialog open={dialog === 'cancel'} onClose={() => setDialog(null)}
        title="Cancel Transfer" description={transfer.status === 'dispatched' ? `This transfer is already dispatched. Cancelling will restore stock to ${fromSub?.name}.` : 'Cancel this transfer request?'}
        confirmLabel="Cancel Transfer" confirmVariant="danger"
        onConfirm={() => handleAction('cancel')} />
    </div>
  )
}
