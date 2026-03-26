'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Bell, TrendingUp, Calendar, Loader2, X, Send, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { fireNotification } from '@/lib/notifications'

interface OverdueInvoice {
  id: string
  vendor_invoice_no: string
  total_amount: number
  due_date: string
  days_overdue: number
  vendor_id: string
  vendor_name?: string
}

interface Props {
  invoices: OverdueInvoice[]
  userRole: string
}

export default function CreditEscalationActions({ invoices, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showCommitModal, setShowCommitModal] = useState<OverdueInvoice | null>(null)
  const [commitDate, setCommitDate] = useState('')
  const [commitNote, setCommitNote] = useState('')

  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)
  if (!canManage) return null

  const handleBulkReminder = useCallback(async () => {
    setLoading(true)
    const overdueIds = invoices.filter(i => i.days_overdue > 0).map(i => i.id)
    if (overdueIds.length === 0) { toast.error('No overdue invoices'); setLoading(false); return }

    try {
      // Mark as reminded
      const { error } = await supabase.from('invoices')
        .update({ updated_at: new Date().toISOString() })
        .in('id', overdueIds)
      if (error) throw error

      // Log reminders in audit
      try {
        await supabase.from('audit_logs').insert({
          entity_type: 'invoice', action: 'bulk_payment_reminder',
          details: { count: overdueIds.length, ids: overdueIds },
        })
      } catch { /* non-critical */ }

      fireNotification({
        action: 'payment_reminder_sent', entity_type: 'invoice',
        details: { count: overdueIds.length },
      })

      toast.success(`Payment reminders sent for ${overdueIds.length} invoices`)
      router.refresh()
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setLoading(false) }
  }, [invoices, supabase, router])

  const handleEscalate = useCallback(async (invoice: OverdueInvoice) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('invoices').update({
        updated_at: new Date().toISOString(),
      }).eq('id', invoice.id)
      if (error) throw error

      // Log escalation in audit
      try {
        await supabase.from('audit_logs').insert({
          entity_type: 'invoice', entity_id: invoice.id, action: 'invoice_escalated',
          details: { vendor: invoice.vendor_name, amount: invoice.total_amount, days_overdue: invoice.days_overdue },
        })
      } catch { /* non-critical */ }

      toast.success(`${invoice.vendor_invoice_no} escalated to management`)
      router.refresh()
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setLoading(false) }
  }, [supabase, router])

  const handlePaymentCommit = useCallback(async () => {
    if (!showCommitModal || !commitDate) { toast.error('Select a commitment date'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('invoices').update({
        updated_at: new Date().toISOString(),
      }).eq('id', showCommitModal.id)
      if (error) throw error

      // Log commitment in audit (columns don't exist on invoices table)
      try {
        await supabase.from('audit_logs').insert({
          entity_type: 'invoice', entity_id: showCommitModal.id, action: 'payment_commitment',
          details: { commitment_date: commitDate, notes: commitNote, vendor: showCommitModal.vendor_name, amount: showCommitModal.total_amount },
        })
      } catch { /* non-critical */ }

      toast.success(`Payment commitment set for ${showCommitModal.vendor_invoice_no}`)
      setShowCommitModal(null); setCommitDate(''); setCommitNote(''); router.refresh()
    } catch (err: any) { toast.error(err.message || 'Failed') }
    finally { setLoading(false) }
  }, [showCommitModal, commitDate, commitNote, supabase, router])

  const overdueCount = invoices.filter(i => i.days_overdue > 0).length
  const criticalCount = invoices.filter(i => i.days_overdue > 90).length

  return (
    <>
      {/* Bulk action bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Quick Actions:</span>

        <button onClick={handleBulkReminder} disabled={loading || overdueCount === 0}
          className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-40 transition-colors flex items-center gap-1.5 font-medium">
          <Bell size={12} /> Send Reminders ({overdueCount})
        </button>

        {criticalCount > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold flex items-center gap-1">
            <AlertTriangle size={11} /> {criticalCount} invoices &gt;90 days overdue
          </span>
        )}
      </div>

      {/* Per-invoice actions rendered as part of the aging table */}
      <div className="space-y-2">
        {invoices.filter(i => i.days_overdue > 0).slice(0, 20).map(inv => (
          <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2">
            <div className="flex-1 min-w-0">
              <span className="font-mono text-xs font-semibold text-gray-900">{inv.vendor_invoice_no}</span>
              <span className="text-xs text-gray-500 ml-2">{inv.vendor_name}</span>
              <span className="text-xs text-red-600 font-medium ml-2">{inv.days_overdue}d overdue</span>
              <span className="text-xs text-gray-500 ml-2">₹{inv.total_amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setShowCommitModal(inv)} title="Set payment commitment"
                className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium">
                <Calendar size={10} className="inline mr-0.5" /> Commit
              </button>
              {inv.days_overdue > 60 && (
                <button onClick={() => handleEscalate(inv)} disabled={loading} title="Escalate to management"
                  className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium">
                  <TrendingUp size={10} className="inline mr-0.5" /> Escalate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment commitment modal */}
      {showCommitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setShowCommitModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in space-y-3">
            <button onClick={() => setShowCommitModal(null)} disabled={loading} className="absolute top-3 right-3 text-gray-400"><X size={16} /></button>
            <h3 className="text-sm font-bold text-navy-600">Set Payment Commitment</h3>
            <p className="text-xs text-gray-500">
              {showCommitModal.vendor_invoice_no} · ₹{showCommitModal.total_amount.toLocaleString('en-IN')} · {showCommitModal.vendor_name}
            </p>
            <div>
              <label className="form-label">Commitment Date</label>
              <input type="date" value={commitDate} onChange={e => setCommitDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Notes <span className="text-gray-400 text-xs">(optional)</span></label>
              <textarea value={commitNote} onChange={e => setCommitNote(e.target.value)} rows={2} className="form-input text-sm"
                placeholder="e.g., Vendor agreed to Saturday batch..." />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowCommitModal(null)} disabled={loading} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handlePaymentCommit} disabled={loading || !commitDate}
                className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {loading ? <Loader2 size={12} className="animate-spin" /> : 'Set Commitment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
