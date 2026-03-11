'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, Download, CheckCircle, Clock, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const DOCUMENT_TYPES = [
  'GSTIN Certificate',
  'PAN Card',
  'Drug License',
  'FSSAI Certificate',
  'Cancelled Cheque',
  'Other',
] as const

type DocumentType = typeof DOCUMENT_TYPES[number]

interface VendorDocument {
  id: string
  vendor_id: string
  document_type: string
  file_name: string
  file_path: string
  is_verified: boolean
  uploaded_at: string
}

export default function VendorDocumentsPage() {
  const params = useParams<{ id: string }>()
  const vendorId = params.id
  const supabase = createClient()

  const [documents, setDocuments] = useState<VendorDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [documentType, setDocumentType] = useState<DocumentType>('GSTIN Certificate')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [vendorName, setVendorName] = useState<string>('')

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vendor_documents')
      .select('id, vendor_id, document_type, file_name, file_path, is_verified, uploaded_at')
      .eq('vendor_id', vendorId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      toast.error('Failed to load documents')
    } else {
      setDocuments(data ?? [])
    }
    setLoading(false)
  }, [vendorId, supabase])

  const fetchVendor = useCallback(async () => {
    const { data } = await supabase
      .from('vendors')
      .select('legal_name')
      .eq('id', vendorId)
      .single()

    if (data) setVendorName(data.legal_name)
  }, [vendorId, supabase])

  useEffect(() => {
    fetchDocuments()
    fetchVendor()
  }, [fetchDocuments, fetchVendor])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 10 MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = selectedFile.name.split('.').pop()
      const sanitizedType = documentType.toLowerCase().replace(/\s+/g, '-')
      const filePath = `${vendorId}/${sanitizedType}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('vendor_documents')
        .insert({
          vendor_id: vendorId,
          document_type: documentType,
          file_name: selectedFile.name,
          file_path: filePath,
          is_verified: false,
        })

      if (insertError) throw insertError

      toast.success('Document uploaded successfully')
      setSelectedFile(null)
      setDocumentType('GSTIN Certificate')

      // Reset the file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      await fetchDocuments()
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(doc: VendorDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .createSignedUrl(doc.file_path, 60)

      if (error) throw error

      window.open(data.signedUrl, '_blank')
    } catch {
      toast.error('Failed to generate download link')
    }
  }

  async function handleDelete(doc: VendorDocument) {
    if (!confirm(`Delete "${doc.file_name}"? This action cannot be undone.`)) return

    try {
      const { error: storageError } = await supabase.storage
        .from('vendor-documents')
        .remove([doc.file_path])

      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('vendor_documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) throw dbError

      toast.success('Document deleted')
      await fetchDocuments()
    } catch {
      toast.error('Failed to delete document')
    }
  }

  return (
    <div>
      <Link
        href={`/vendors/${vendorId}`}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back to Vendor
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Documents</h1>
          {vendorName && (
            <p className="text-sm text-gray-500 mt-1">{vendorName}</p>
          )}
        </div>
      </div>

      {/* Upload Form */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
          <Upload size={16} className="text-[#0D7E8A]" />
          Upload New Document
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                className="form-input w-full"
                value={documentType}
                onChange={e => setDocumentType(e.target.value as DocumentType)}
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              <input
                id="file-input"
                type="file"
                className="form-input w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#1B3A6B] file:text-white hover:file:bg-[#15305a] file:cursor-pointer"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-400 mt-1">
                PDF, JPG, PNG, DOC up to 10 MB
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn-primary flex items-center gap-2"
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText size={16} className="text-[#0D7E8A]" />
          <h2 className="font-semibold text-gray-900">
            Uploaded Documents ({documents.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
            <p className="text-sm text-gray-400 mt-2">Loading documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700">
                        {doc.document_type}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">{doc.file_name}</span>
                    </td>
                    <td className="text-sm text-gray-600">
                      {formatDate(doc.uploaded_at)}
                    </td>
                    <td>
                      {doc.is_verified ? (
                        <span className="badge bg-green-100 text-green-700 inline-flex items-center gap-1">
                          <CheckCircle size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="badge bg-yellow-100 text-yellow-800 inline-flex items-center gap-1">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-[#0D7E8A] hover:text-[#0a6570] transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">
            <FileText size={32} className="mx-auto mb-2 text-gray-300" />
            No documents uploaded yet. Use the form above to upload vendor documents.
          </div>
        )}
      </div>
    </div>
  )
}
