'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Upload, FileText, CheckCircle, ArrowLeft, ChevronRight, X, AlertTriangle } from 'lucide-react'

interface POOption {
  id: string
  po_number: string
  po_date: string
  total_amount: number
  centre: { code: string } | null
}

const STEPS = ['Select PO', 'Upload File', 'Enter Details', 'Review & Submit']

export default function VendorInvoiceUploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)

  // Step 0: PO selection
  const [pos, setPOs] = useState<POOption[]>([])
  const [selectedPO, setSelectedPO] = useState<POOption | null>(null)
  const [poSearch, setPOSearch] = useState('')

  // Step 1: File upload
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedPath, setUploadedPath] = useState<string | null>(null)

  // Step 2: Invoice details
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [subtotal, setSubtotal] = useState('')
  const [cgst, setCgst] = useState('')
  const [sgst, setSgst] = useState('')
  const [igst, setIgst] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  // Auto-calculate total
  useEffect(() => {
    const sub = parseFloat(subtotal) || 0
    const c = parseFloat(cgst) || 0
    const s = parseFloat(sgst) || 0
    const i = parseFloat(igst) || 0
    setTotalAmount((sub + c + s + i).toFixed(2))
  }, [subtotal, cgst, sgst, igst])

  // Load POs
  useEffect(() => {
    async function loadPOs() {
      try {
        const res = await fetch('/api/vendor/invoices/eligible-pos')
        const data = await res.json()
        if (data.pos) setPOs(data.pos)
      } catch (err) {
        toast.error('Failed to load POs')
      }
      setLoading(false)
    }
    loadPOs()
  }, [])

  async function handleFileUpload(selectedFile: File) {
    setFile(selectedFile)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('po_id', selectedPO?.id || '')

    try {
      const res = await fetch('/api/vendor/invoices/upload-file', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUploadedPath(data.path)
      toast.success('File uploaded')
    } catch (err: any) {
      toast.error(err.message)
      setFile(null)
    }
    setUploading(false)
  }

  async function handleSubmit() {
    if (!selectedPO || !uploadedPath || !vendorInvoiceNo || !invoiceDate || !totalAmount) {
      toast.error('All required fields must be filled')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/vendor/invoices/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: selectedPO.id,
          vendor_invoice_no: vendorInvoiceNo,
          vendor_invoice_date: invoiceDate,
          subtotal: parseFloat(subtotal) || 0,
          gst_amount: (parseFloat(cgst) || 0) + (parseFloat(sgst) || 0) + (parseFloat(igst) || 0),
          total_amount: parseFloat(totalAmount),
          invoice_file_path: uploadedPath,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Submission failed')
      toast.success('Invoice submitted successfully!')
      router.push('/vendor/invoices')
    } catch (err: any) {
      toast.error(err.message)
    }
    setSubmitting(false)
  }

  const filteredPOs = pos.filter(po =>
    !poSearch || po.po_number.toLowerCase().includes(poSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#0D7E8A] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendor/invoices" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Invoice</h1>
          <p className="text-sm text-gray-500">Submit an invoice against a purchase order</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors',
              i < step ? 'bg-green-100 text-green-700' :
              i === step ? 'bg-[#0D7E8A] text-white' :
              'bg-gray-100 text-gray-500'
            )}>
              {i < step ? <CheckCircle size={14} /> : <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select PO */}
      {step === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Purchase Order</h2>
          <input
            type="text" value={poSearch} onChange={(e) => setPOSearch(e.target.value)}
            placeholder="Search by PO number..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]"
          />
          {filteredPOs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredPOs.map((po) => (
                <button
                  key={po.id}
                  onClick={() => { setSelectedPO(po); setStep(1) }}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer',
                    selectedPO?.id === po.id ? 'border-[#0D7E8A] bg-[#0D7E8A]/5' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-semibold text-gray-900">{po.po_number}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{formatDate(po.po_date)} | {po.centre?.code}</div>
                    </div>
                    <div className="text-sm font-bold text-[#1B3A6B]">{formatCurrency(po.total_amount)}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <AlertTriangle size={32} className="mx-auto mb-2 text-gray-400" />
              No eligible purchase orders found
            </div>
          )}
        </div>
      )}

      {/* Step 1: Upload File */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Invoice File</h2>
          <p className="text-sm text-gray-500 mb-4">For PO: <span className="font-semibold text-gray-700">{selectedPO?.po_number}</span></p>

          {!file ? (
            <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#0D7E8A] transition-colors cursor-pointer">
              <Upload size={40} className="text-gray-400 mb-3" />
              <span className="text-sm font-medium text-gray-700">Click to upload or drag & drop</span>
              <span className="text-xs text-gray-500 mt-1">PDF, JPG, PNG — max 10 MB</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <FileText size={24} className="text-[#0D7E8A]" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#0D7E8A] rounded-full animate-spin" />
              ) : uploadedPath ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : null}
              <button onClick={() => { setFile(null); setUploadedPath(null) }} className="p-1 hover:bg-gray-200 rounded cursor-pointer"><X size={16} /></button>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={!uploadedPath}
              className="px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] disabled:opacity-50 transition-colors cursor-pointer"
            >Next: Enter Details</button>
          </div>
        </div>
      )}

      {/* Step 2: Enter Details */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Invoice Number *</label>
              <input type="text" value={vendorInvoiceNo} onChange={(e) => setVendorInvoiceNo(e.target.value)}
                placeholder="e.g. INV-2026-001" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Date *</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtotal (before GST) *</label>
              <input type="number" value={subtotal} onChange={(e) => setSubtotal(e.target.value)} step="0.01"
                placeholder="0.00" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CGST</label>
                <input type="number" value={cgst} onChange={(e) => setCgst(e.target.value)} step="0.01"
                  placeholder="0" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SGST</label>
                <input type="number" value={sgst} onChange={(e) => setSgst(e.target.value)} step="0.01"
                  placeholder="0" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">IGST</label>
                <input type="number" value={igst} onChange={(e) => setIgst(e.target.value)} step="0.01"
                  placeholder="0" className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-[#1B3A6B]/5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Invoice Amount</span>
              <span className="text-xl font-bold text-[#1B3A6B]">{formatCurrency(parseFloat(totalAmount) || 0)}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Back</button>
            <button
              onClick={() => setStep(3)}
              disabled={!vendorInvoiceNo || !invoiceDate || !subtotal}
              className="px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] disabled:opacity-50 transition-colors cursor-pointer"
            >Next: Review</button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Purchase Order</span><span className="font-semibold">{selectedPO?.po_number}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Your Invoice No.</span><span className="font-semibold">{vendorInvoiceNo}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Invoice Date</span><span className="font-semibold">{invoiceDate ? formatDate(invoiceDate) : '—'}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">File</span><span className="font-semibold">{file?.name}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{formatCurrency(parseFloat(subtotal) || 0)}</span></div>
            <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">GST</span><span className="font-semibold">{formatCurrency((parseFloat(cgst) || 0) + (parseFloat(sgst) || 0) + (parseFloat(igst) || 0))}</span></div>
            <div className="flex justify-between py-3 bg-[#1B3A6B]/5 rounded-xl px-4 -mx-2"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-[#1B3A6B] text-base">{formatCurrency(parseFloat(totalAmount) || 0)}</span></div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Back</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Invoice'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
