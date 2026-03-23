'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ArrowLeft, Users, Package, Link2, Warehouse, CreditCard,
  MapPin, Eye, History, ArrowRight, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

const IMPORT_TYPES = [
  {
    id: 'vendors', label: 'Vendors', icon: <Users size={20} />,
    desc: 'Import vendor master data — legal name, GSTIN, PAN, bank details, contacts, TDS info',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    order: 1,
  },
  {
    id: 'items', label: 'Items / SKUs', icon: <Package size={20} />,
    desc: 'Import item master — generic name, manufacturer, units, HSN, GST, drug flags',
    color: 'bg-green-50 text-green-700 border-green-200',
    order: 2,
  },
  {
    id: 'vendor_items', label: 'Vendor-Item Mapping', icon: <Link2 size={20} />,
    desc: 'Map which vendors supply which items with L1/L2/L3 ranking and rates',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    order: 3, dep: 'Requires vendors + items imported first',
  },
  {
    id: 'opening_stock', label: 'Opening Stock', icon: <Warehouse size={20} />,
    desc: 'Import opening stock balances by centre with reorder levels',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    order: 4, dep: 'Requires items imported first',
  },
  {
    id: 'vendor_outstanding', label: 'Vendor Outstanding', icon: <CreditCard size={20} />,
    desc: 'Import pending invoices / outstanding dues from Tally or Google Sheets',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    order: 5, dep: 'Requires vendors imported first',
  },
]

// Expected columns for each import type
const EXPECTED_COLUMNS: Record<string, string[]> = {
  vendors: ['legal_name', 'trade_name', 'category', 'gstin', 'pan', 'drug_license_no', 'primary_contact_name', 'primary_contact_phone', 'primary_contact_email', 'address', 'city', 'state', 'pincode', 'bank_name', 'bank_account_no', 'bank_ifsc', 'bank_account_type', 'credit_period_days', 'credit_limit', 'centres_served'],
  items: ['generic_name', 'brand_name', 'category', 'sub_category', 'unit', 'hsn_code', 'gst_percent', 'manufacturer', 'is_drug', 'drug_schedule', 'is_narcotic', 'mrp'],
  vendor_items: ['vendor_code', 'item_code', 'l_rank', 'rate', 'lead_time_days', 'moq'],
  opening_stock: ['item_code', 'centre_code', 'quantity', 'rate', 'reorder_level', 'safety_stock', 'batch_no', 'expiry_date'],
  vendor_outstanding: ['vendor_code', 'invoice_no', 'invoice_date', 'amount', 'paid_amount', 'due_date', 'centre_code'],
}

interface ImportError {
  row: number
  field?: string
  message: string
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: ImportError[]
  created_codes?: string[]
}

interface ImportHistoryEntry {
  id: string
  action: string
  entity_type: string
  details: any
  created_at: string
}

interface ColumnMapping {
  sourceColumn: string
  targetColumn: string
}

export default function DataImportPage() {
  const supabase = createClient()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Column mapping state
  const [showMapping, setShowMapping] = useState(false)
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const { data } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, details, created_at')
      .eq('action', 'bulk_import')
      .order('created_at', { ascending: false })
      .limit(20)
    setImportHistory(data || [])
  }

  async function downloadTemplate(type: string, format: 'xlsx' | 'csv' = 'xlsx') {
    const res = await fetch(`/api/import/templates?type=${type}&format=${format}`)
    if (!res.ok) { toast.error('Failed to download template'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `H1_${type}_template.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadErrorCSV() {
    if (!result || result.errors.length === 0) return
    const header = 'Row,Field,Error\n'
    const rows = result.errors.map(e =>
      `${e.row},"${(e.field || '').replace(/"/g, '""')}","${e.message.replace(/"/g, '""')}"`
    ).join('\n')
    const csv = header + rows
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import_errors_${selectedType}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFileSelect(f: File) {
    setFile(f)
    setResult(null)
    setShowMapping(false)

    if (!selectedType) return

    // Read file headers for column mapping preview
    const formData = new FormData()
    formData.append('file', f)
    formData.append('type', selectedType)
    formData.append('preview', 'true')

    try {
      const res = await fetch('/api/import/preview', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        if (data.columns && data.columns.length > 0) {
          setDetectedColumns(data.columns)
          setPreviewRows(data.rows || [])

          // Auto-map columns by fuzzy matching
          const expected = EXPECTED_COLUMNS[selectedType] || []
          const autoMappings: ColumnMapping[] = expected.map(target => {
            const normalizedTarget = target.toLowerCase().replace(/_/g, ' ')
            const match = data.columns.find((col: string) => {
              const normalizedCol = col.toLowerCase().replace(/[_\s-]/g, ' ')
              return normalizedCol === normalizedTarget ||
                normalizedCol.includes(normalizedTarget) ||
                normalizedTarget.includes(normalizedCol)
            })
            return { targetColumn: target, sourceColumn: match || '' }
          })
          setColumnMappings(autoMappings)
          setShowMapping(true)
        }
      }
    } catch {
      // If preview fails, just proceed with direct import
      setShowMapping(false)
    }
  }

  function updateMapping(targetCol: string, sourceCol: string) {
    setColumnMappings(prev => prev.map(m =>
      m.targetColumn === targetCol ? { ...m, sourceColumn: sourceCol } : m
    ))
  }

  async function handleImport() {
    if (!file || !selectedType) { toast.error('Select a file to import'); return }

    setImporting(true)
    setResult(null)
    setProgress(0)

    // Simulate progress during import
    let currentProgress = 0
    progressRef.current = setInterval(() => {
      currentProgress += Math.random() * 15
      if (currentProgress > 90) currentProgress = 90
      setProgress(Math.round(currentProgress))
    }, 500)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', selectedType)

    // Include column mappings if user has mapped columns
    if (showMapping && columnMappings.length > 0) {
      const mappingObj: Record<string, string> = {}
      columnMappings.forEach(m => {
        if (m.sourceColumn) mappingObj[m.targetColumn] = m.sourceColumn
      })
      formData.append('column_mapping', JSON.stringify(mappingObj))
    }

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(100)

      if (!res.ok) {
        toast.error(data.error || 'Import failed')
        setImporting(false)
        return
      }

      setResult(data)

      // Log to audit_logs
      try {
        await supabase.from('audit_logs').insert({
          action: 'bulk_import',
          entity_type: selectedType,
          details: {
            file_name: file.name,
            total: data.total,
            success: data.success,
            failed: data.failed,
          },
        })
      } catch {
        // Non-blocking
      }

      if (data.success > 0 && data.failed === 0) {
        toast.success(`All ${data.success} records imported successfully!`)
      } else if (data.success > 0) {
        toast(`${data.success} imported, ${data.failed} failed`, { icon: '⚠️' })
      } else {
        toast.error(`Import failed — ${data.failed} errors`)
      }
    } catch {
      if (progressRef.current) clearInterval(progressRef.current)
      toast.error('Network error during import')
    }
    setImporting(false)
    loadHistory()
  }

  const selectedConfig = IMPORT_TYPES.find(t => t.id === selectedType)

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href="/settings/users" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Settings
          </Link>
          <h1 className="page-title">Bulk Data Import</h1>
          <p className="page-subtitle">
            Import vendors, items, stock, and outstanding data from Excel, CSV, Tally exports, or Google Sheets
          </p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary">
          <History size={16} /> {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      {/* Import order notice */}
      <div className="bg-[#E6F5F6] rounded-lg p-4 mb-6 text-sm text-[#0D7E8A]">
        <strong>Import Order:</strong> Follow this sequence to avoid dependency errors:
        <span className="font-medium"> 1. Vendors → 2. Items → 3. Vendor-Item Mapping → 4. Opening Stock → 5. Vendor Outstanding</span>
      </div>

      {/* Import History */}
      {showHistory && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1B3A6B] flex items-center gap-2">
              <History size={16} /> Import History
            </h2>
          </div>
          {importHistory.length === 0 ? (
            <div className="empty-state py-8">
              <p className="text-sm text-gray-400">No imports recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>File</th><th>Total</th><th>Success</th><th>Failed</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {importHistory.map(entry => (
                    <tr key={entry.id}>
                      <td className="text-xs text-gray-600">{formatDateTime(new Date(entry.created_at))}</td>
                      <td><span className="badge bg-blue-50 text-blue-700 capitalize">{entry.entity_type?.replace(/_/g, ' ')}</span></td>
                      <td className="text-xs text-gray-700 font-mono">{entry.details?.file_name || '—'}</td>
                      <td className="text-sm font-medium">{entry.details?.total || 0}</td>
                      <td className="text-sm text-green-600 font-medium">{entry.details?.success || 0}</td>
                      <td className="text-sm text-red-600 font-medium">{entry.details?.failed || 0}</td>
                      <td>
                        {entry.details?.failed === 0 ? (
                          <span className="badge bg-green-50 text-green-700">Clean</span>
                        ) : (
                          <span className="badge bg-yellow-50 text-yellow-700">Partial</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Choose type */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Step 1 — Select Import Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMPORT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => { setSelectedType(type.id); setResult(null); setFile(null); setShowMapping(false) }}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedType === type.id
                  ? 'border-[#0D7E8A] bg-[#E6F5F6] ring-1 ring-[#0D7E8A]/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${type.color.split(' ').slice(0, 1).join(' ')}`}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{type.order}. {type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                  {type.dep && <div className="text-xs text-orange-600 mt-1 font-medium">{type.dep}</div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Download template + Upload */}
      {selectedType && (
        <div className="space-y-6">
          {/* Template downloads */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Step 2 — Download Template</h2>
            <p className="text-sm text-gray-500 mb-4">
              Download the template, fill in your data (delete sample rows), and save as .xlsx or .csv
            </p>
            <div className="flex gap-3">
              <button onClick={() => downloadTemplate(selectedType, 'xlsx')} className="btn-primary">
                <Download size={16} /> Download Excel Template (.xlsx)
              </button>
              <button onClick={() => downloadTemplate(selectedType, 'csv')} className="btn-secondary">
                <Download size={16} /> Download CSV Template
              </button>
            </div>
          </div>

          {/* File upload */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Step 3 — Upload File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet size={40} className="mx-auto text-gray-300 mb-3" />
              <div className="mb-3">
                <label className="cursor-pointer">
                  <span className="btn-secondary inline-flex items-center gap-2">
                    <Upload size={16} /> Choose File
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleFileSelect(f)
                    }}
                  />
                </label>
              </div>
              {file ? (
                <div className="text-sm text-gray-700">
                  <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                </div>
              ) : (
                <div className="text-sm text-gray-400">Supports .xlsx, .xls, and .csv files (max 5000 rows)</div>
              )}
            </div>
          </div>

          {/* Column Mapping UI */}
          {showMapping && detectedColumns.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#0D7E8A]" /> Step 4 — Map Columns
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                We detected {detectedColumns.length} columns in your file. Map them to the expected fields below.
                Auto-mapped fields are pre-filled.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {columnMappings.map(mapping => (
                  <div key={mapping.targetColumn} className="flex items-center gap-2">
                    <div className="w-40 text-xs font-medium text-gray-700 truncate" title={mapping.targetColumn}>
                      {mapping.targetColumn.replace(/_/g, ' ')}
                      {(selectedType === 'vendors' && mapping.targetColumn === 'legal_name') ||
                       (selectedType === 'items' && mapping.targetColumn === 'generic_name') ? (
                        <span className="text-red-500 ml-0.5">*</span>
                      ) : null}
                    </div>
                    <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                    <select
                      className="form-select text-xs flex-1"
                      value={mapping.sourceColumn}
                      onChange={e => updateMapping(mapping.targetColumn, e.target.value)}
                    >
                      <option value="">— Skip —</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {previewRows.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Eye size={12} /> Preview (first 3 rows)
                  </h3>
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {detectedColumns.slice(0, 8).map(col => (
                            <th key={col} className="px-2 py-1 text-left text-gray-500 font-medium">{col}</th>
                          ))}
                          {detectedColumns.length > 8 && <th className="px-2 py-1 text-gray-400">+{detectedColumns.length - 8} more</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            {detectedColumns.slice(0, 8).map(col => (
                              <td key={col} className="px-2 py-1 text-gray-700 truncate max-w-[150px]">{row[col] || ''}</td>
                            ))}
                            {detectedColumns.length > 8 && <td className="px-2 py-1 text-gray-400">...</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import button */}
          {file && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {showMapping ? 'Step 5' : 'Step 4'} — Import
              </h2>

              {/* Progress bar */}
              {importing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Importing {selectedConfig?.label}...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-[#0D7E8A] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={handleImport} disabled={importing} className="btn-navy">
                  {importing ? <><Loader2 size={16} className="animate-spin" /> Importing {selectedConfig?.label}...</>
                    : <><Upload size={16} /> Import {selectedConfig?.label}</>}
                </button>
                <span className="text-xs text-gray-400">This may take a minute for large files</span>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="card overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between ${
                result.failed === 0 ? 'bg-green-50' : result.success > 0 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  {result.failed === 0 ? <CheckCircle2 size={20} className="text-green-600" /> :
                   result.success > 0 ? <AlertTriangle size={20} className="text-yellow-600" /> :
                   <XCircle size={20} className="text-red-600" />}
                  <div>
                    <div className="font-semibold text-gray-900">
                      Import Complete: {result.success} of {result.total} records imported
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.success} success, {result.failed} failed
                    </div>
                  </div>
                </div>

                {/* Download error CSV */}
                {result.errors.length > 0 && (
                  <button onClick={downloadErrorCSV} className="btn-secondary text-xs">
                    <Download size={14} /> Download Error Report (.csv)
                  </button>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="p-6">
                  <h3 className="font-semibold text-red-700 mb-3 text-sm">
                    Errors ({result.errors.length})
                  </h3>
                  <div className="max-h-72 overflow-y-auto overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr><th>Row</th><th>Field</th><th>Error</th></tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, i) => (
                          <tr key={i}>
                            <td className="font-mono text-sm">{err.row}</td>
                            <td className="text-sm font-medium">{err.field || '—'}</td>
                            <td className="text-sm text-red-600">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
