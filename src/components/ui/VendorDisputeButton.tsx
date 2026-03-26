'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VendorDisputeButton({ invoiceId, invoiceRef }: { invoiceId: string; invoiceRef: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!reason.trim()) { toast.error('Reason required'); return }
    setLoading(true)
    const { error } = await supabase.from('invoices').update({
      payment_status: 'disputed', dispute_reason: reason,
      disputed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', invoiceId)
    if (error) { toast.error(error.message); setLoading(false); return }
    try { await supabase.from('audit_logs').insert({ entity_type: 'invoice', entity_id: invoiceId, action: 'vendor_dispute', details: { invoice_ref: invoiceRef, reason } }) } catch {}
    toast.success('Dispute submitted')
    setOpen(false); setReason(''); setLoading(false); router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-[10px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors">
        Dispute
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in">
            <button onClick={() => setOpen(false)} disabled={loading} className="absolute top-3 right-3 text-gray-500"><X size={16} /></button>
            <h3 className="text-sm font-semibold mb-1">Dispute Invoice {invoiceRef}</h3>
            <textarea className="form-input text-sm mt-2" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the dispute..." />
            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setOpen(false)} disabled={loading} className="btn-secondary text-xs">Cancel</button>
              <button onClick={submit} disabled={loading || !reason.trim()} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
