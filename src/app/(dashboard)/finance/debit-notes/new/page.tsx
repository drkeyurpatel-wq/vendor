'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'
import { format } from 'date-fns'

export default function NewDebitNotePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [vendors, setVendors] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [vendorId, setVendorId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [reason, setReason] = useState('')
  const [subtotal, setSubtotal] = useState('')
  const [gstAmount, setGstAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const { data: v } = await supabase.from('vendors').select('id, legal_name, vendor_code').eq('is_active', true).order('legal_name')
      setVendors(v || [])
      setPageLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!vendorId) { setInvoices([]); return }
    async function loadInvoices() {
      const { data } = await supabase.from('invoices')
        .select('id, invoice_ref, vendor_invoice_no, total_amount, grn_id')
        .eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(50)
      setInvoices(data || [])
    }
    loadInvoices()
  }, [vendorId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!vendorId) errs.vendor = 'Required'
    if (!reason.trim()) errs.reason = 'Required'
    if (!subtotal || parseFloat(subtotal) <= 0) errs.subtotal = 'Must be > 0'
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('user_profiles').select('centre_id').eq('id', user!.id).single()

    const sub = parseFloat(subtotal)
    const gst = gstAmount ? parseFloat(gstAmount) : 0
    const total = sub + gst

    const now = new Date()
    const yyMM = format(now, 'yyMM')
    const { count } = await supabase.from('debit_notes').select('*', { count: 'exact', head: true })
    const dnNumber = `H1-DN-${yyMM}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const selectedInvoice = invoices.find(i => i.id === invoiceId)

    const { error } = await supabase.from('debit_notes').insert({
      debit_note_number: dnNumber,
      vendor_id: vendorId,
      centre_id: profile?.centre_id || null,
      invoice_id: invoiceId || null,
      grn_id: selectedInvoice?.grn_id || null,
      reason: reason.trim(),
      subtotal: sub,
      gst_amount: gst,
      total_amount: total,
      status: 'draft',
      notes: notes.trim() || null,
      created_by: user!.id,
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success(`Debit Note ${dnNumber} created`)
    router.push('/finance/debit-notes')
  }

  if (pageLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#1B3A6B]" /></div>

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <div>
          <Link href="/finance/debit-notes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Debit Notes
          </Link>
          <h1 className="page-title">New Debit Note</h1>
          <p className="page-subtitle">Issue a debit note against a vendor for returns, shortages, or rate differences</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Create Debit Note</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Vendor & Invoice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vendor *</label>
              <select className="form-select" value={vendorId}
                onChange={e => { setVendorId(e.target.value); setInvoiceId(''); setFieldErrors(p => { const n = {...p}; delete n.vendor; return n }) }}
                aria-invalid={!!fieldErrors.vendor}>
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_code} — {v.legal_name}</option>)}
              </select>
              <FieldError message={fieldErrors.vendor} />
            </div>
            <div>
              <label className="form-label">Against Invoice (optional)</label>
              <select className="form-select" value={invoiceId} onChange={e => setInvoiceId(e.target.value)}>
                <option value="">No specific invoice</option>
                {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_ref} — {inv.vendor_invoice_no} (₹{inv.total_amount?.toLocaleString('en-IN')})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Debit Note Details</h2>
          <div className="space-y-4">
            <div>
              <label className="form-label">Reason *</label>
              <select className="form-select" value={reason}
                onChange={e => { setReason(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.reason; return n }) }}
                aria-invalid={!!fieldErrors.reason}>
                <option value="">Select reason...</option>
                <option value="Goods returned — damaged">Goods returned — damaged</option>
                <option value="Goods returned — wrong item">Goods returned — wrong item</option>
                <option value="Goods returned — near expiry">Goods returned — near expiry</option>
                <option value="Short supply">Short supply</option>
                <option value="Rate difference">Rate difference</option>
                <option value="Quality rejection">Quality rejection</option>
                <option value="Duplicate billing">Duplicate billing</option>
                <option value="Other">Other</option>
              </select>
              <FieldError message={fieldErrors.reason} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Subtotal (₹) *</label>
                <input type="number" step="0.01" className="form-input" value={subtotal}
                  onChange={e => { setSubtotal(e.target.value); setFieldErrors(p => { const n = {...p}; delete n.subtotal; return n }) }}
                  placeholder="0.00" aria-invalid={!!fieldErrors.subtotal} />
                <FieldError message={fieldErrors.subtotal} />
              </div>
              <div>
                <label className="form-label">GST Amount (₹)</label>
                <input type="number" step="0.01" className="form-input" value={gstAmount}
                  onChange={e => setGstAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            {subtotal && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-500">Total:</span>{' '}
                <span className="font-bold text-[#1B3A6B]">₹{(parseFloat(subtotal || '0') + parseFloat(gstAmount || '0')).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            )}
            <div>
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional remarks..." />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
