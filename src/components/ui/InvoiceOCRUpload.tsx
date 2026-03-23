'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExtractedData {
  vendor_invoice_no: string | null
  invoice_date: string | null
  subtotal: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  total_amount: number | null
  vendor_gstin: string | null
}

interface Props {
  onExtracted: (data: ExtractedData, fileUrl: string) => void
}

export default function InvoiceOCRUpload({ onExtracted }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ data: ExtractedData; confidence: number; fileUrl: string; fileName: string; message?: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file) return

    // Validate
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, PNG, JPG files are supported')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB')
      return
    }

    // Preview for images
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/ocr/invoice', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const data = await res.json()
      setResult({
        data: data.data,
        confidence: data.confidence,
        fileUrl: data.file_url,
        fileName: data.file_name,
        message: data.message,
      })

      // Auto-fill if we got data
      if (data.confidence > 0) {
        onExtracted(data.data, data.file_url)
        toast.success('Invoice data extracted — fields auto-filled')
      } else {
        // Still pass file URL even without OCR
        onExtracted({ ...data.data }, data.file_url)
        toast('File uploaded. Fill in details manually.', { icon: '📎' })
      }
    } catch (err: any) {
      toast.error(err.message || 'OCR failed')
    }
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="card p-5 border-dashed border-2 border-gray-200 hover:border-teal-400 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
          <Camera size={18} className="text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Scan Invoice (Optional)</h3>
          <p className="text-xs text-gray-500">Upload vendor invoice to auto-fill details</p>
        </div>
      </div>

      {!result && !uploading && (
        <div
          className="border border-gray-200 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          <Upload size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">Drop invoice PDF/image here or click to upload</p>
          <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG — max 10 MB</p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg">
          <Loader2 size={18} className="animate-spin text-teal-600" />
          <span className="text-sm text-teal-700 font-medium">Uploading and scanning...</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${result.confidence > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            {result.confidence > 0 ? (
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{result.fileName}</div>
              <div className="text-xs text-gray-500">
                {result.confidence > 0
                  ? `Extracted with ${Math.round(result.confidence * 100)}% confidence`
                  : result.message || 'Manual entry required'}
              </div>
            </div>
            <button onClick={() => { setResult(null); setPreviewUrl(null); if (fileRef.current) fileRef.current.value = '' }}
              className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>

          {/* Image preview */}
          {previewUrl && (
            <div className="max-h-48 overflow-hidden rounded-lg border border-gray-200">
              <img src={previewUrl} alt="Invoice preview" className="w-full object-contain" />
            </div>
          )}

          {/* Extracted fields preview */}
          {result.confidence > 0 && result.data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {result.data.vendor_invoice_no && (
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Invoice No</div>
                  <div className="font-medium text-gray-900">{result.data.vendor_invoice_no}</div>
                </div>
              )}
              {result.data.invoice_date && (
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Date</div>
                  <div className="font-medium text-gray-900">{result.data.invoice_date}</div>
                </div>
              )}
              {result.data.total_amount && (
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Total</div>
                  <div className="font-medium text-gray-900">₹{result.data.total_amount.toLocaleString('en-IN')}</div>
                </div>
              )}
              {result.data.vendor_gstin && (
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">GSTIN</div>
                  <div className="font-mono font-medium text-gray-900">{result.data.vendor_gstin}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
