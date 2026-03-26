'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Image, X, Loader2, AlertCircle, CheckCircle2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface InvoiceScanUploadProps {
  vendorId: string
  onExtracted: (data: any) => void
  onFileUploaded: (url: string) => void
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function InvoiceScanUpload({ vendorId, onExtracted, onFileUploaded }: InvoiceScanUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Invalid file type. Only PDF, PNG, and JPG files are allowed.'
    }
    if (f.size > MAX_SIZE) {
      return `File too large (${formatFileSize(f.size)}). Maximum size is 10MB.`
    }
    return null
  }, [])

  const handleFile = useCallback((f: File) => {
    const validationError = validateFile(f)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(f)
    setError(null)
    setResult(null)

    // Create preview for images
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [validateFile])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setUploadProgress(10)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vendor_id', vendorId)

      setUploadProgress(30)

      const response = await fetch('/api/ocr/invoice', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(70)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadProgress(100)
      setResult(data)

      // Notify parent
      if (data.file_url) {
        onFileUploaded(data.file_url)
      }
      if (data.data) {
        onExtracted(data.data)
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    setUploadProgress(0)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone - shown when no file selected */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragOver
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EEF2F9' }}>
              <Upload size={22} style={{ color: '#1B3A6B' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop invoice file here or <span style={{ color: '#0D7E8A' }}>browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, PNG, or JPG up to 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* File preview */}
      {file && !result && (
        <div className="card p-4">
          <div className="flex items-start gap-4">
            {/* Preview thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center" style={{ backgroundColor: '#EEF2F9' }}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Invoice preview" className="w-full h-full object-cover" />
              ) : (
                <FileText size={28} style={{ color: '#1B3A6B' }} />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatFileSize(file.size)} &middot; {file.type === 'application/pdf' ? 'PDF' : file.type.split('/')[1]?.toUpperCase()}
              </p>

              {/* Progress bar */}
              {uploading && (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%`, backgroundColor: '#0D7E8A' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!uploading && (
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    className="btn-primary text-sm"
                  >
                    <Upload size={14} className="mr-1.5 inline" />
                    Upload &amp; Extract
                  </button>
                </>
              )}
              {uploading && (
                <Loader2 size={20} className="animate-spin" style={{ color: '#0D7E8A' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* OCR Result */}
      {result && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {result.confidence > 0 ? (
                <CheckCircle2 size={18} style={{ color: '#0D7E8A' }} />
              ) : (
                <AlertCircle size={18} className="text-yellow-500" />
              )}
              <span className="text-sm font-medium" style={{ color: '#1B3A6B' }}>
                {result.confidence > 0 ? 'Data Extracted' : 'Manual Entry Required'}
              </span>
              {result.confidence > 0 && (
                <span className="badge bg-green-100 text-green-800 text-xs">
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {result.file_url && (
                <a
                  href={result.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={12} /> View File
                </a>
              )}
              <button type="button" onClick={handleClear} className="text-xs text-gray-500 hover:text-gray-600">
                Upload Another
              </button>
            </div>
          </div>

          {result.confidence === 0 && (
            <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: '#E6F5F6', color: '#0D7E8A' }}>
              {result.message}
            </div>
          )}

          {/* Show file info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-50">
            {file?.type === 'application/pdf' ? (
              <FileText size={14} className="text-gray-500" />
            ) : (
              <Image size={14} className="text-gray-500" />
            )}
            <span>{result.file_name}</span>
            <span>{formatFileSize(result.file_size)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
