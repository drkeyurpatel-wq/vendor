'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Wallet, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatLakhs, formatDate, cn } from '@/lib/utils'
import { fireInAppNotification } from '@/lib/notify'

interface EligibleInvoice {
  id: string
  invoice_ref: string
  vendor_invoice_no: string
  vendor_invoice_date: string
  total_amount: number
  paid_amount: number
  due_date: string
  vendor: { legal_name: string } | { legal_name: string }[] | null
  centre: { code: string } | { code: string }[] | null
}

function getNextSaturday(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Saturday = 6
  const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek)
  const nextSat = new Date(now)
  nextSat.setDate(nextSat.getDate() + daysUntilSaturday)
  return nextSat.toISOString().split('T')[0]
}

export default function NewPaymentBatchPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [invoices, setInvoices] = useState<EligibleInvoice[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDate, setBatchDate] = useState(getNextSaturday())
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      // Fetch matched invoices that are unpaid/partial and due_date <= today
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, due_date, vendor:vendors(legal_name), centre:centres(code)')
        .eq('match_status', 'matched')
        .in('payment_status', ['unpaid', 'partial'])
        .lte('due_date', today)
        .order('due_date', { ascending: true })

      if (data) setInvoices(data as EligibleInvoice[])
      setPageLoading(false)
    }
    load()
  }, [])

  function toggleInvoice(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(invoices.map(inv => inv.id)))
    }
  }

  const selectedInvoices = invoices.filter(inv => selectedIds.has(inv.id))
  const totalSelectedAmount = selectedInvoices.reduce(
    (sum, inv) => sum + (inv.total_amount - (inv.paid_amount ?? 0)),
    0
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedIds.size === 0) {
      toast.error('Select at least one invoice')
      return
    }
    if (!batchDate) {
      toast.error('Batch date is required')
      return
    }

    setLoading(true)

    // Generate batch_number: H1-BATCH-{yyMM}-{seq}
    const yyMM = format(new Date(), 'yyMM')
    const { count } = await supabase
      .from('payment_batches')
      .select('*', { count: 'exact', head: true })

    const seq = (count ?? 0) + 1
    const batchNumber = `H1-BATCH-${yyMM}-${String(seq).padStart(3, '0')}`

    // Create batch record
    const { data: batch, error } = await supabase.from('payment_batches').insert({
      batch_number: batchNumber,
      batch_date: batchDate,
      total_amount: totalSelectedAmount,
      payment_count: selectedIds.size,
      status: 'pending_approval',
      notes: notes.trim() || null,
    }).select().single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Insert batch items
    const batchItems = selectedInvoices.map(inv => ({
      batch_id: batch.id,
      invoice_id: inv.id,
      vendor_id: (inv as any).vendor_id ?? null,
      amount: inv.total_amount - (inv.paid_amount ?? 0),
    }))

    const { error: itemsError } = await supabase
      .from('payment_batch_items')
      .insert(batchItems)

    if (itemsError) {
      toast.error(itemsError.message)
      setLoading(false)
      return
    }

    toast.success(`Payment batch ${batchNumber} created with ${selectedIds.size} invoices`)

    // Notify: in-app to CAO/admin for approval
    fireInAppNotification(
      'payment_batch_created',
      'payment_batch',
      batch.id,
      { batch_number: batchNumber, amount: totalSelectedAmount, invoice_count: selectedIds.size }
    )

    router.push('/finance/payments')
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#1B3A6B]" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="page-header">
        <div>
          <Link href="/finance/payments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Payments
          </Link>
          <h1 className="page-title">New Payment Batch</h1>
          <p className="page-subtitle">Saturday payment cycle — select matched invoices due for payment</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create Batch</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Batch Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Batch Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Batch Date (Saturday) *</label>
              <input
                type="date"
                className="form-input"
                value={batchDate}
                onChange={e => setBatchDate(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Defaults to next Saturday</p>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input
                className="form-input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional batch notes..."
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedIds.size > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="stat-card border-l-4 border-[#1B3A6B]">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare size={18} className="text-[#1B3A6B]" />
                <span className="text-sm font-semibold text-gray-700">Selected Invoices</span>
              </div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{selectedIds.size}</div>
            </div>
            <div className="stat-card border-l-4 border-[#0D7E8A]">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={18} className="text-[#0D7E8A]" />
                <span className="text-sm font-semibold text-gray-700">Total Amount</span>
              </div>
              <div className="text-2xl font-bold text-[#0D7E8A]">{formatLakhs(totalSelectedAmount)}</div>
            </div>
          </div>
        )}

        {/* Eligible Invoices */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Eligible Invoices</h2>
            <span className="text-sm text-gray-500">{invoices.length} invoices due</span>
          </div>

          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === invoices.length && invoices.length > 0}
                        onChange={toggleAll}
                        className="rounded border-gray-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
                      />
                    </th>
                    <th>Invoice Ref</th>
                    <th>Vendor Invoice</th>
                    <th>Vendor</th>
                    <th>Centre</th>
                    <th>Due Date</th>
                    <th>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const outstanding = inv.total_amount - (inv.paid_amount ?? 0)
                    const isSelected = selectedIds.has(inv.id)
                    return (
                      <tr
                        key={inv.id}
                        className={cn('cursor-pointer', isSelected && 'bg-blue-50')}
                        onClick={() => toggleInvoice(inv.id)}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleInvoice(inv.id)}
                            className="rounded border-gray-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
                          />
                        </td>
                        <td><span className="font-mono text-xs font-semibold">{inv.invoice_ref}</span></td>
                        <td className="font-mono text-xs text-gray-600">{inv.vendor_invoice_no}</td>
                        <td className="text-sm font-medium text-gray-900">{(inv.vendor as any)?.legal_name}</td>
                        <td><span className="badge bg-blue-50 text-blue-700">{(inv.centre as any)?.code}</span></td>
                        <td className="text-sm text-red-600 font-medium">{formatDate(inv.due_date)}</td>
                        <td className="text-sm font-semibold">{formatLakhs(outstanding)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Wallet size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No eligible invoices</p>
              <p className="text-sm text-gray-400 mt-1">No matched invoices with due date on or before today</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pb-6 flex-wrap">
          <button type="submit" disabled={loading || selectedIds.size === 0} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create Batch</>}
          </button>
          <Link href="/finance/payments" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
