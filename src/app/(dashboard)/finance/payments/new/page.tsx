'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Building2, CreditCard, IndianRupee, AlertTriangle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface InvoiceRow {
  id: string; invoice_ref: string; vendor_invoice_no: string | null; vendor_invoice_date: string | null
  total_amount: number; paid_amount: number; due_date: string | null
  vendor: any; centre: any; vendor_id: string
}

const PAYMENT_MODES = [
  { value: 'neft', label: 'NEFT' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'imps', label: 'IMPS' },
  { value: 'upi', label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'dd', label: 'Demand Draft' },
  { value: 'cash', label: 'Cash' },
]

const HEALTH1_BANK_ACCOUNTS = [
  { value: 'hdfc_shilaj', label: 'HDFC — Shilaj (Current A/c)', ifsc: 'HDFC0001234' },
  { value: 'sbi_main', label: 'SBI — Main (Current A/c)', ifsc: 'SBIN0005678' },
  { value: 'icici_od', label: 'ICICI — OD Account', ifsc: 'ICIC0009012' },
]

interface LineItem {
  invoiceId: string; vendorName: string; invoiceRef: string; vendorInvoiceNo: string
  grossAmount: number; outstanding: number; tdsPercent: number; tdsAmount: number
  debitNoteAdj: number; advanceAdj: number; netPayable: number; selected: boolean
  vendorBankName: string; vendorAccountNo: string; vendorIfsc: string
  vendorPan: string; tdsApplicable: boolean; dueDateStr: string
}

export default function NewPaymentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [lines, setLines] = useState<LineItem[]>([])
  const [paymentMode, setPaymentMode] = useState('neft')
  const [bankAccount, setBankAccount] = useState('hdfc_shilaj')
  const [batchDate, setBatchDate] = useState(getNextSaturday())
  const [notes, setNotes] = useState('')

  function getNextSaturday(): string {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 6 ? 0 : 6 - day
    d.setDate(d.getDate() + diff)
    return format(d, 'yyyy-MM-dd')
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, due_date, vendor_id, vendor:vendors(id, legal_name, vendor_code, bank_name, bank_account_no, bank_ifsc, pan_number, tds_applicable, default_tds_percent, upi_id), centre:centres(code)')
        .in('payment_status', ['unpaid', 'partial'])
        .is('deleted_at', null)
        .order('due_date')
        .limit(200)

      const invs = (data || []) as unknown as InvoiceRow[]
      setInvoices(invs)

      setLines(invs.map(inv => {
        const outstanding = (inv.total_amount || 0) - (inv.paid_amount || 0)
        const tdsApplicable = inv.vendor?.tds_applicable || false
        const tdsPercent = tdsApplicable ? (inv.vendor?.default_tds_percent || 2) : 0
        const tdsAmount = Math.round(outstanding * tdsPercent / 100 * 100) / 100
        return {
          invoiceId: inv.id, vendorName: inv.vendor?.legal_name || '', invoiceRef: inv.invoice_ref,
          vendorInvoiceNo: inv.vendor_invoice_no || '', grossAmount: inv.total_amount || 0,
          outstanding, tdsPercent, tdsAmount, debitNoteAdj: 0, advanceAdj: 0,
          netPayable: Math.round((outstanding - tdsAmount) * 100) / 100,
          selected: false,
          vendorBankName: inv.vendor?.bank_name || '', vendorAccountNo: inv.vendor?.bank_account_no || '',
          vendorIfsc: inv.vendor?.bank_ifsc || '', vendorPan: inv.vendor?.pan_number || '',
          tdsApplicable, dueDateStr: inv.due_date || '',
        }
      }))
      setPageLoading(false)
    }
    load()
  }, [])

  function toggleLine(idx: number) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, selected: !l.selected } : l))
  }
  function toggleAll() {
    const allSelected = lines.every(l => l.selected)
    setLines(prev => prev.map(l => ({ ...l, selected: !allSelected })))
  }
  function updateTDS(idx: number, pct: number) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l
      const tds = Math.round(l.outstanding * pct / 100 * 100) / 100
      return { ...l, tdsPercent: pct, tdsAmount: tds, netPayable: Math.round((l.outstanding - tds - l.debitNoteAdj - l.advanceAdj) * 100) / 100 }
    }))
  }
  function updateDeduction(idx: number, field: 'debitNoteAdj' | 'advanceAdj', value: number) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l
      const updated = { ...l, [field]: value }
      updated.netPayable = Math.round((updated.outstanding - updated.tdsAmount - updated.debitNoteAdj - updated.advanceAdj) * 100) / 100
      return updated
    }))
  }

  const selectedLines = lines.filter(l => l.selected)
  const totals = useMemo(() => ({
    gross: selectedLines.reduce((s, l) => s + l.outstanding, 0),
    tds: selectedLines.reduce((s, l) => s + l.tdsAmount, 0),
    debitNote: selectedLines.reduce((s, l) => s + l.debitNoteAdj, 0),
    advance: selectedLines.reduce((s, l) => s + l.advanceAdj, 0),
    net: selectedLines.reduce((s, l) => s + l.netPayable, 0),
  }), [selectedLines])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedLines.length === 0) { toast.error('Select at least one invoice'); return }
    if (selectedLines.some(l => !l.vendorAccountNo && paymentMode !== 'cash' && paymentMode !== 'upi')) {
      const missing = selectedLines.filter(l => !l.vendorAccountNo).map(l => l.vendorName)
      const proceed = window.confirm(`Bank details missing for: ${missing.join(', ')}.\n\nContinue anyway?`)
      if (!proceed) return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { count } = await supabase.from('payment_batches').select('*', { count: 'exact', head: true })
    const batchNumber = `H1-PAY-${format(new Date(), 'yyMM')}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { data: batch, error } = await supabase.from('payment_batches').insert({
      batch_number: batchNumber, batch_date: batchDate,
      total_amount: Math.round(totals.net * 100) / 100,
      payment_count: selectedLines.length,
      payment_mode: paymentMode, bank_account: bankAccount,
      status: 'pending_approval',
      notes: notes.trim() || null,
    }).select().single()

    if (error || !batch) { toast.error(error?.message || 'Failed'); setLoading(false); return }

    const batchItems = selectedLines.map(l => ({
      batch_id: batch.id, invoice_id: l.invoiceId, vendor_id: invoices.find(i => i.id === l.invoiceId)?.vendor_id,
      amount: l.outstanding, tds_percent: l.tdsPercent, tds_amount: l.tdsAmount,
      debit_note_adj: l.debitNoteAdj, advance_adj: l.advanceAdj,
      net_payable: l.netPayable, payment_mode: paymentMode, status: 'pending',
    }))
    await supabase.from('payment_batch_items').insert(batchItems)

    // Update invoice payment_batch_id
    for (const l of selectedLines) {
      await supabase.from('invoices').update({ payment_batch_id: batch.id }).eq('id', l.invoiceId)
    }

    toast.success(`Batch ${batchNumber} — ${selectedLines.length} invoices — ${formatCurrency(totals.net)} net payable`)
    router.push(`/finance/payments/${batch.id}`)
  }

  if (pageLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#1B3A6B]" /></div>

  return (
    <div>
      <Link href="/finance/payments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Create Payment Batch</h1>
          <p className="page-subtitle">Saturday payment cycle — select invoices, apply TDS/deductions, approve for payment</p>
        </div>
        <button onClick={handleSubmit} disabled={loading || selectedLines.length === 0} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Save size={16} /> Create Batch ({selectedLines.length})</>}
        </button>
      </div>

      {/* Payment Settings */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Payment Date (Saturday)</label>
            <input type="date" className="form-input" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Payment Mode</label>
            <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Health1 Bank Account</label>
            <select className="form-select" value={bankAccount} onChange={e => setBankAccount(e.target.value)}>
              {HEALTH1_BANK_ACCOUNTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Weekly vendor payments" />
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      {selectedLines.length > 0 && (
        <div className="card p-4 mb-6 bg-gradient-to-r from-[#1B3A6B] to-[#0D7E8A] text-white">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div><div className="text-[10px] uppercase tracking-wider opacity-70">Gross</div><div className="text-lg font-bold">{formatCurrency(totals.gross)}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider opacity-70">TDS</div><div className="text-lg font-bold text-red-300">-{formatCurrency(totals.tds)}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider opacity-70">Debit Notes</div><div className="text-lg font-bold text-red-300">-{formatCurrency(totals.debitNote)}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider opacity-70">Advance Adj</div><div className="text-lg font-bold text-red-300">-{formatCurrency(totals.advance)}</div></div>
            <div className="bg-white/10 rounded-lg p-1"><div className="text-[10px] uppercase tracking-wider opacity-70">Net Payable</div><div className="text-xl font-bold">{formatCurrency(totals.net)}</div></div>
          </div>
        </div>
      )}

      {/* Invoice Selection Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#1B3A6B]">Unpaid Invoices ({lines.length})</h2>
          <button onClick={toggleAll} className="text-xs text-teal-600 hover:underline font-medium">
            {lines.every(l => l.selected) ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"><input type="checkbox" checked={lines.length > 0 && lines.every(l => l.selected)} onChange={toggleAll} /></th>
                <th>Invoice</th>
                <th>Vendor</th>
                <th>Bank Details</th>
                <th>Due Date</th>
                <th className="text-right">Outstanding</th>
                <th className="text-center w-20">TDS %</th>
                <th className="text-right">TDS</th>
                <th className="text-right w-24">DN Adj</th>
                <th className="text-right w-24">Adv Adj</th>
                <th className="text-right">Net Payable</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const overdue = line.dueDateStr && new Date(line.dueDateStr) < new Date()
                return (
                  <tr key={line.invoiceId} className={cn('hover:bg-gray-50', line.selected && 'bg-teal-50/50')}>
                    <td><input type="checkbox" checked={line.selected} onChange={() => toggleLine(idx)} /></td>
                    <td>
                      <Link href={`/finance/invoices/${line.invoiceId}`} className="font-mono text-xs text-teal-600 hover:underline font-semibold">{line.invoiceRef}</Link>
                      {line.vendorInvoiceNo && <div className="text-[10px] text-gray-400">{line.vendorInvoiceNo}</div>}
                    </td>
                    <td>
                      <div className="text-sm font-medium text-gray-900">{line.vendorName}</div>
                      {line.vendorPan && <div className="text-[10px] text-gray-400">PAN: {line.vendorPan}</div>}
                    </td>
                    <td className="text-xs">
                      {line.vendorAccountNo ? (
                        <div>
                          <div className="font-mono text-gray-700">{line.vendorAccountNo}</div>
                          <div className="text-gray-400">{line.vendorBankName} | {line.vendorIfsc}</div>
                        </div>
                      ) : (
                        <span className="text-orange-500 flex items-center gap-1"><AlertTriangle size={10} /> No bank</span>
                      )}
                    </td>
                    <td className={cn('text-xs', overdue ? 'text-red-600 font-semibold' : 'text-gray-600')}>
                      {line.dueDateStr ? format(new Date(line.dueDateStr), 'dd MMM yy') : '—'}
                      {overdue && <div className="text-[10px]">OVERDUE</div>}
                    </td>
                    <td className="text-sm text-right font-semibold">{formatCurrency(line.outstanding)}</td>
                    <td className="text-center">
                      {line.tdsApplicable ? (
                        <input type="number" step="0.1" min="0" max="20" className="form-input text-xs text-center w-16 mx-auto"
                          value={line.tdsPercent} onChange={e => updateTDS(idx, parseFloat(e.target.value) || 0)} />
                      ) : <span className="text-xs text-gray-300">N/A</span>}
                    </td>
                    <td className="text-sm text-right text-red-600">{line.tdsAmount > 0 ? `-${formatCurrency(line.tdsAmount)}` : '—'}</td>
                    <td>
                      <input type="number" step="0.01" min="0" className="form-input text-xs text-right w-24"
                        value={line.debitNoteAdj || ''} onChange={e => updateDeduction(idx, 'debitNoteAdj', parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </td>
                    <td>
                      <input type="number" step="0.01" min="0" className="form-input text-xs text-right w-24"
                        value={line.advanceAdj || ''} onChange={e => updateDeduction(idx, 'advanceAdj', parseFloat(e.target.value) || 0)}
                        placeholder="0" />
                    </td>
                    <td className="text-sm text-right font-bold text-[#1B3A6B]">{formatCurrency(line.netPayable)}</td>
                  </tr>
                )
              })}
            </tbody>
            {selectedLines.length > 0 && (
              <tfoot>
                <tr className="bg-[#EEF2F9] font-semibold">
                  <td colSpan={5} className="text-right text-sm text-[#1B3A6B]">{selectedLines.length} selected</td>
                  <td className="text-right text-sm">{formatCurrency(totals.gross)}</td>
                  <td></td>
                  <td className="text-right text-sm text-red-600">{totals.tds > 0 ? `-${formatCurrency(totals.tds)}` : ''}</td>
                  <td className="text-right text-sm text-red-600">{totals.debitNote > 0 ? `-${formatCurrency(totals.debitNote)}` : ''}</td>
                  <td className="text-right text-sm text-red-600">{totals.advance > 0 ? `-${formatCurrency(totals.advance)}` : ''}</td>
                  <td className="text-right text-sm font-bold text-[#1B3A6B]">{formatCurrency(totals.net)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
