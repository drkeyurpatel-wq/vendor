'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, AlertTriangle, MessageCircle, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  poId: string
  poNumber: string
  poStatus: string
  vendorId: string
}

export default function VendorPOActions({ poId, poNumber, poStatus, vendorId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [action, setAction] = useState<'acknowledge' | 'dispute' | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState('')

  const canAcknowledge = poStatus === 'sent_to_vendor'
  const canDispute = ['sent_to_vendor', 'approved'].includes(poStatus)

  async function handleAcknowledge() {
    setLoading(true)
    const { error } = await supabase.from('purchase_orders').update({
      vendor_acknowledged: true,
      vendor_acknowledged_at: new Date().toISOString(),
      vendor_confirmed_delivery_date: deliveryDate || null,
      vendor_notes: comment || null,
      updated_at: new Date().toISOString(),
    }).eq('id', poId)

    if (error) { toast.error(error.message); setLoading(false); return }

    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'purchase_order', entity_id: poId,
        action: 'vendor_acknowledged',
        details: { po_number: poNumber, delivery_date: deliveryDate, notes: comment },
      })
    } catch {}

    toast.success(`PO ${poNumber} acknowledged`)
    setAction(null); setLoading(false); router.refresh()
  }

  async function handleDispute() {
    if (!comment.trim()) { toast.error('Please describe the dispute'); return }
    setLoading(true)

    const { error } = await supabase.from('purchase_orders').update({
      vendor_dispute: true,
      vendor_dispute_reason: comment,
      vendor_dispute_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', poId)

    if (error) { toast.error(error.message); setLoading(false); return }

    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'purchase_order', entity_id: poId,
        action: 'vendor_dispute',
        details: { po_number: poNumber, reason: comment },
      })
      await supabase.from('notifications').insert({
        action: 'vendor_dispute', entity_type: 'purchase_order', entity_id: poId,
        details: { po_number: poNumber, reason: comment },
      })
    } catch {}

    toast.success('Dispute raised')
    setAction(null); setComment(''); setLoading(false); router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canAcknowledge && (
          <button onClick={() => setAction('acknowledge')} className="btn-primary text-sm">
            <CheckCircle2 size={14} /> Acknowledge PO
          </button>
        )}
        {canDispute && (
          <button onClick={() => setAction('dispute')} className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
            <AlertTriangle size={14} className="inline mr-1" /> Raise Dispute
          </button>
        )}
      </div>

      {action && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <button onClick={() => setAction(null)} disabled={loading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {action === 'acknowledge' ? 'Acknowledge Purchase Order' : 'Raise Dispute'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">PO {poNumber}</p>

            <div className="space-y-3 mb-4">
              {action === 'acknowledge' && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Expected delivery date</label>
                  <input type="date" className="form-input text-sm" value={deliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  {action === 'dispute' ? 'Dispute reason (required)' : 'Notes (optional)'}
                </label>
                <textarea className="form-input text-sm" rows={3} value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={action === 'dispute' ? 'Describe the issue — pricing, items, delivery terms...' : 'Any notes for the buyer...'} />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setAction(null)} disabled={loading} className="btn-secondary text-sm">Cancel</button>
              <button onClick={action === 'acknowledge' ? handleAcknowledge : handleDispute}
                disabled={loading || (action === 'dispute' && !comment.trim())}
                className={`text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${action === 'acknowledge' ? 'bg-[#0D7E8A] hover:bg-[#0b6b75]' : 'bg-red-600 hover:bg-red-700'}`}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : action === 'acknowledge' ? 'Acknowledge' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
