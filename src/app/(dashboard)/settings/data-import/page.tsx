'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ArrowLeft, Users, Package, Link2, Warehouse, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

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

export default function DataImportPage() {
  const supabase = createClient()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

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

  async function handleImport() {
    if (!file || !selectedType) { toast.error('Select a file to import'); return }

    setImporting(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', selectedType)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Import failed')
        setImporting(false)
        return
      }

      setResult(data)
      if (data.success > 0 && data.failed === 0) {
        toast.success(`All ${data.success} records imported successfully!`)
      } else if (data.success > 0) {
        toast(`${data.success} imported, ${data.failed} failed`, { icon: '⚠️' })
      } else {
        toast.error(`Import failed — ${data.failed} errors`)
      }
    } catch {
      toast.error('Network error during import')
    }
    setImporting(false)
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
      </div>

      {/* Import order notice */}
      <div className="bg-[#E6F5F6] rounded-lg p-4 mb-6 text-sm text-[#0D7E8A]">
        <strong>Import Order:</strong> Follow this sequence to avoid dependency errors:
        <span className="font-medium"> 1. Vendors → 2. Items → 3. Vendor-Item Mapping → 4. Opening Stock → 5. Vendor Outstanding</span>
      </div>

      {/* Step 1: Choose type */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Step 1 — Select Import Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMPORT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => { setSelectedType(type.id); setResult(null); setFile(null) }}
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
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Step 3 — Upload & Import</h2>
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
                      if (f) { setFile(f); setResult(null) }
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

            {file && (
              <div className="mt-4 flex items-center gap-3">
                <button onClick={handleImport} disabled={importing} className="btn-navy">
                  {importing ? <><Loader2 size={16} className="animate-spin" /> Importing {selectedConfig?.label}...</>
                    : <><Upload size={16} /> Import {selectedConfig?.label}</>}
                </button>
                <span className="text-xs text-gray-400">This may take a minute for large files</span>
              </div>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="card overflow-hidden">
              <div className={`px-6 py-4 flex items-center gap-3 ${
                result.failed === 0 ? 'bg-green-50' : result.success > 0 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
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

              {result.errors.length > 0 && (
                <div className="p-6">
                  <h3 className="font-semibold text-red-700 mb-3 text-sm">
                    Errors ({result.errors.length})
                  </h3>
                  <div className="max-h-72 overflow-y-auto">
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
