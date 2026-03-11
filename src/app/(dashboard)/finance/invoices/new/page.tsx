'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface GRNOption {
  id: string
  grn_number: string
  grn_date: string
  po_id: string
  vendor_id: string
  centre_id: string
  vendor: { legal_name: string; credit_period_days: number } | { legal_name: string; credit_period_days: number }[] | null
  centre: { code: string; name: string } | { code: string; name: string }[] | null
}

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [grns, setGrns] = useState<GRNOption[]>([])
  const [selectedGRN, setSelectedGRN] = useState<GRNOption | null>(null)

  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('')
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [gstAmount, setGstAmount] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    async function load() {
      // Fetch GRNs that do NOT already have an invoice
      const { data: existingInvoiceGrnIds } = await supabase
        .from('invoices')
        .select('grn_id')

      const usedGrnIds = (existingInvoiceGrnIds ?? [])
        .map((inv: any) => inv.grn_id)
        .filter(Boolean)

      let query = supabase
        .from('grns')
        .select('id, grn_number, grn_date, po_id, vendor_id, centre_id, vendor:vendors(legal_name, credit_period_days), centre:centres(code, name)')
        .in('status', ['submitted', 'verified'])
        .is('deleted_at', null)
        .order('grn_date', { ascending: false })

      if (usedGrnIds.length > 0) {
        // Supabase doesn't have .not('id', 'in', [...]) natively in all versions,
        // so we filter client-side for reliability
      }

      const { data: allGrns } = await query

      if (allGrns) {
        const usedSet = new Set(usedGrnIds)
        const eligible = allGrns.filter((g: any) => !usedSet.has(g.id))
        setGrns(eligible as GRNOption[])
      }

      setPageLoading(false)
    }
    load()
  }, [])

  function handleGRNSelect(grnId: string) {
    const grn = grns.find(g => g.id === grnId)
    if (!grn) {
      setSelectedGRN(null)
      setDueDate('')
      return
    }
    setSelectedGRN(grn)

    // Auto-calculate due_date = grn_date + vendor.credit_period_days
    const creditDays = (grn.vendor as any)?.credit_period_days ?? 30
    const grnDateObj = new Date(grn.grn_date)
    const calculatedDue = new Date(grnDateObj)
    calculatedDue.setDate(calculatedDue.getDate() + creditDays)
    setDueDate(calculatedDue.toISOString().split('T')[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedGRN) {
      toast.error('Please select a GRN')
      return
    }
    if (!vendorInvoiceNo.trim()) {
      toast.error('Vendor invoice number is required')
      return
    }
    if (!vendorInvoiceDate) {
      toast.error('Vendor invoice date is required')
      return
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error('Total amount must be greater than zero')
      return
    }

    setLoading(true)

    // Duplicate check: vendor_id + vendor_invoice_no
    const { data: duplicate } = await supabase
      .from('invoices')
      .select('id')
      .eq('vendor_id', selectedGRN.vendor_id)
      .eq('vendor_invoice_no', vendorInvoiceNo.trim())
      .limit(1)

    if (duplicate && duplicate.length > 0) {
      toast.error('Duplicate: An invoice with this vendor invoice number already exists for this vendor')
      setLoading(false)
      return
    }

    // Generate invoice_ref: H1-{centreCode}-INV-{yyMM}-{seq}
    const centreCode = (selectedGRN.centre as any)?.code || 'XXX'
    const now = new Date()
    const yyMM = format(now, 'yyMM')

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    const seq = (count ?? 0) + 1
    const invoiceRef = `H1-${centreCode}-INV-${yyMM}-${String(seq).padStart(3, '0')}`

    const creditDays = (selectedGRN.vendor as any)?.credit_period_days ?? 30

    const { data: invoice, error } = await supabase.from('invoices').insert({
      invoice_ref: invoiceRef,
      grn_id: selectedGRN.id,
      po_id: selectedGRN.po_id,
      vendor_id: selectedGRN.vendor_id,
      centre_id: selectedGRN.centre_id,
      vendor_invoice_no: vendorInvoiceNo.trim(),
      vendor_invoice_date: vendorInvoiceDate,
      total_amount: parseFloat(totalAmount),
      gst_amount: gstAmount ? parseFloat(gstAmount) : 0,
      paid_amount: 0,
      due_date: dueDate,
      credit_period_days: creditDays,
      match_status: 'pending',
      payment_status: 'unpaid',
    }).select().single()

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Trigger 3-way matching
    try {
      await fetch('/api/invoices/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.id }),
      })
    } catch {
      // Non-blocking — matching can be retried later
      console.warn('3-way match trigger failed, can be retried')
    }

    toast.success(`Invoice ${invoiceRef} created successfully`)
    router.push('/finance/invoices')
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#1B3A6B]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <div>
          <Link href="/finance/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Invoices
          </Link>
          <h1 className="page-title">New Invoice</h1>
          <p className="page-subtitle">Create invoice from a received GRN</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Invoice</>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GRN Selection */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Select GRN</h2>

          {grns.length === 0 ? (
            <div className="empty-state">
              <FileText size={36} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No uninvoiced GRNs available</p>
              <p className="text-sm text-gray-400 mt-1">All submitted GRNs already have invoices</p>
            </div>
          ) : (
            <div>
              <label className="form-label">Goods Receipt Note *</label>
              <select
                className="form-select"
                value={selectedGRN?.id || ''}
                onChange={e => handleGRNSelect(e.target.value)}
              >
                <option value="">Select a GRN...</option>
                {grns.map(grn => (
                  <option key={grn.id} value={grn.id}>
                    {grn.grn_number} — {(grn.vendor as any)?.legal_name || 'Unknown Vendor'} ({(grn.centre as any)?.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedGRN && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-xs text-gray-500">Vendor</span>
                <p className="text-sm font-medium text-gray-900">{(selectedGRN.vendor as any)?.legal_name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Centre</span>
                <p className="text-sm font-medium text-gray-900">{(selectedGRN.centre as any)?.code} — {(selectedGRN.centre as any)?.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Credit Period</span>
                <p className="text-sm font-medium text-gray-900">{(selectedGRN.vendor as any)?.credit_period_days ?? 30} days</p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vendor Invoice No. *</label>
              <input
                className="form-input"
                value={vendorInvoiceNo}
                onChange={e => setVendorInvoiceNo(e.target.value)}
                placeholder="Vendor's invoice number"
                required
              />
            </div>
            <div>
              <label className="form-label">Vendor Invoice Date *</label>
              <input
                type="date"
                className="form-input"
                value={vendorInvoiceDate}
                onChange={e => setVendorInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Total Amount (Rs) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="form-label">GST Amount (Rs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={gstAmount}
                onChange={e => setGstAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Auto-calculated from GRN date + vendor credit period</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Invoice</>}
          </button>
          <Link href="/finance/invoices" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
