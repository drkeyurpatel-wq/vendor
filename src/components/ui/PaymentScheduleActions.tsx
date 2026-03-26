'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Calendar, Clock, Pause, Loader2, X, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

interface ScheduledPayment {
  id: string
  vendor_invoice_no: string
  total_amount: number
  due_date: string
  payment_status: string
  vendor_name?: string
  vendor_id?: string
}

export default function PaymentScheduleActions({ payment, userRole }: { payment: ScheduledPayment; userRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [reason, setReason] = useState('')

  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)
  if (!canManage || payment.payment_status === 'paid') return null

  async function handleQuickAction(action: 'hold' | 'unhold') {
    setLoading(true)
    try {
      const { error } = await supabase.from('invoices').update({
        payment_status: action === 'hold' ? 'on_hold' : 'unpaid',
        updated_at: new Date().toISOString(),
      }).eq('id', payment.id)
      if (error) throw error
      toast.success(`${payment.vendor_invoice_no} → ${action === 'hold' ? 'on hold' : 'released'}`)
      router.refresh()
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setLoading(false) }
  }

  async function handleReschedule() {
    if (!newDate) { toast.error('Select a new date'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('invoices').update({
        due_date: newDate,
        reschedule_reason: reason || null,
        updated_at: new Date().toISOString(),
      }).eq('id', payment.id)
      if (error) throw error

      await supabase.from('activity_log').insert({
        entity_type: 'invoice', entity_id: payment.id, action: 'payment_rescheduled',
        details: { old_due: payment.due_date, new_due: newDate, reason },
      }).then(() => {}, () => {})

      toast.success(`Rescheduled to ${newDate}`)
      setShowReschedule(false); setNewDate(''); setReason(''); router.refresh()
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setLoading(false) }
  }

  async function handleAddToBatch() {
    setLoading(true)
    try {
      // Find or create Saturday batch for this week
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
      const nextSaturday = new Date(today)
      nextSaturday.setDate(today.getDate() + daysUntilSat)
      const satDate = nextSaturday.toISOString().split('T')[0]

      let { data: batch } = await supabase.from('payment_batches')
        .select('id, batch_number')
        .eq('batch_date', satDate)
        .eq('status', 'draft')
        .single()

      if (!batch) {
        const { count } = await supabase.from('payment_batches').select('*', { count: 'exact', head: true })
        const batchNum = `H1-BATCH-${String(new Date().getFullYear()).slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String((count ?? 0) + 1).padStart(3, '0')}`
        const { data: created, error: createErr } = await supabase.from('payment_batches').insert({
          batch_number: batchNum, batch_date: satDate, status: 'draft', total_amount: 0,
        }).select('id, batch_number').single()
        if (createErr) throw createErr
        batch = created
      }

      // Add invoice to batch
      await supabase.from('payment_batch_items').insert({
        batch_id: batch!.id, invoice_id: payment.id,
        amount: payment.total_amount, vendor_id: payment.vendor_id,
      })

      // Update batch total
      const { data: items } = await supabase.from('payment_batch_items').select('amount').eq('batch_id', batch!.id)
      const total = items?.reduce((s, i) => s + (i.amount || 0), 0) || 0
      await supabase.from('payment_batches').update({ total_amount: total, item_count: items?.length, updated_at: new Date().toISOString() }).eq('id', batch!.id)

      toast.success(`Added to ${batch!.batch_number} (Saturday ${satDate})`)
      router.refresh()
    } catch (err: any) { toast.error(err.message || 'Failed to add to batch') }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <button onClick={handleAddToBatch} disabled={loading} title="Add to Saturday batch"
          className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium">
          <Wallet size={10} className="inline mr-0.5" /> Batch
        </button>
        <button onClick={() => setShowReschedule(true)} title="Reschedule payment"
          className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">
          <Calendar size={10} className="inline mr-0.5" /> Reschedule
        </button>
        {payment.payment_status !== 'on_hold' ? (
          <button onClick={() => handleQuickAction('hold')} disabled={loading} title="Put on hold"
            className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium">
            <Pause size={10} className="inline mr-0.5" /> Hold
          </button>
        ) : (
          <button onClick={() => handleQuickAction('unhold')} disabled={loading} title="Release hold"
            className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium">
            <Clock size={10} className="inline mr-0.5" /> Release
          </button>
        )}
      </div>

      {showReschedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setShowReschedule(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in space-y-3">
            <button onClick={() => setShowReschedule(false)} disabled={loading} className="absolute top-3 right-3 text-gray-400"><X size={16} /></button>
            <h3 className="text-sm font-bold text-navy-600">Reschedule Payment</h3>
            <p className="text-xs text-gray-500">{payment.vendor_invoice_no} · ₹{payment.total_amount.toLocaleString('en-IN')}</p>
            <div>
              <label className="form-label">New Due Date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="form-input text-sm" placeholder="Why is payment being rescheduled?" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowReschedule(false)} disabled={loading} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleReschedule} disabled={loading || !newDate}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
