'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface ParsedRow {
  ecw_item_code: string
  item_code: string
  centre_code: string
  qty_consumed: number
  date: string
  department: string
  patient_id: string
  notes: string
}

interface ImportResult {
  total: number
  processed: number
  skipped: number
  errors: { row: number; reason: string }[]
  indents_created: number
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })

    return {
      ecw_item_code: row['ecw_item_code'] || row['ecw_code'] || row['item_code_ecw'] || '',
      item_code: row['item_code'] || row['h1_item_code'] || row['sku'] || '',
      centre_code: row['centre_code'] || row['centre'] || row['center_code'] || row['center'] || row['unit'] || '',
      qty_consumed: parseFloat(row['qty_consumed'] || row['qty'] || row['quantity'] || '0'),
      date: row['date'] || row['consumption_date'] || new Date().toISOString().split('T')[0],
      department: row['department'] || row['dept'] || '',
      patient_id: row['patient_id'] || row['mrn'] || '',
      notes: row['notes'] || row['remarks'] || '',
    }
  }).filter(r => (r.ecw_item_code || r.item_code) && r.centre_code && r.qty_consumed > 0)
}

export default function ConsumptionImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      if (parsed.length === 0) {
        toast.error('No valid rows found in CSV')
      } else {
        toast.success(`Parsed ${parsed.length} consumption records`)
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (rows.length === 0) { toast.error('No data to import'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/consumption/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: rows }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Import failed')
      } else {
        setResult(data)
        if (data.processed > 0) {
          toast.success(`Imported ${data.processed} of ${data.total} records`)
        }
        if (data.indents_created > 0) {
          toast(`${data.indents_created} auto-indent(s) created for low stock items`, { icon: '📋' })
        }
      }
    } catch {
      toast.error('Network error during import')
    }
    setLoading(false)
  }

  function downloadTemplate() {
    const template = `ecw_item_code,item_code,centre_code,qty_consumed,date,department,patient_id,notes
ECW001,H1I-00001,SHI,10,2026-03-11,Pharmacy,,Daily consumption
ECW002,,VAS,5,2026-03-11,OT,MRN12345,Surgery consumable
,H1I-00023,MOD,3,2026-03-11,Ward-B,,`
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'consumption_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href="/items/stock" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to Stock Levels
          </Link>
          <h1 className="page-title">Consumption Import</h1>
          <p className="page-subtitle">Upload CSV from eClinicalWorks or manual consumption data</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">How it works</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
          <li>Export consumption data from eClinicalWorks (or prepare a CSV manually)</li>
          <li>CSV must have columns: <code className="text-xs bg-gray-100 px-1 rounded">ecw_item_code</code> or <code className="text-xs bg-gray-100 px-1 rounded">item_code</code>, <code className="text-xs bg-gray-100 px-1 rounded">centre_code</code>, <code className="text-xs bg-gray-100 px-1 rounded">qty_consumed</code></li>
          <li>Optional columns: <code className="text-xs bg-gray-100 px-1 rounded">date</code>, <code className="text-xs bg-gray-100 px-1 rounded">department</code>, <code className="text-xs bg-gray-100 px-1 rounded">patient_id</code>, <code className="text-xs bg-gray-100 px-1 rounded">notes</code></li>
          <li>Items are matched via <strong>ecw_item_code</strong> (set in Item Master) or <strong>H1 item code</strong></li>
          <li>Stock is deducted and logged. If stock falls below reorder level, a <strong>purchase indent is auto-created</strong></li>
        </ol>
        <button onClick={downloadTemplate} className="mt-4 flex items-center gap-2 text-sm text-[#0D7E8A] hover:underline font-medium">
          <Download size={14} /> Download CSV Template
        </button>
      </div>

      {/* Upload */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upload CSV File</h2>
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#0D7E8A] transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
          <FileSpreadsheet size={36} className="mx-auto mb-3 text-gray-300" />
          {fileName ? (
            <div>
              <p className="font-medium text-gray-700">{fileName}</p>
              <p className="text-sm text-[#0D7E8A] mt-1">{rows.length} records parsed</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-500">Click to select CSV file</p>
              <p className="text-xs text-gray-400 mt-1">Supports .csv and .txt files</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && !result && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Preview ({rows.length} records)</h2>
            <button onClick={handleImport} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : <><Upload size={16} /> Import & Deduct Stock</>}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>eCW Code</th>
                  <th>Item Code</th>
                  <th>Centre</th>
                  <th>Qty</th>
                  <th>Date</th>
                  <th>Dept</th>
                  <th>Patient</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td className="text-xs text-gray-400">{i + 1}</td>
                    <td className="font-mono text-xs">{r.ecw_item_code || '—'}</td>
                    <td className="font-mono text-xs">{r.item_code || '—'}</td>
                    <td><span className="badge bg-blue-50 text-blue-700">{r.centre_code}</span></td>
                    <td className="text-sm font-semibold">{r.qty_consumed}</td>
                    <td className="text-sm text-gray-600">{r.date}</td>
                    <td className="text-xs text-gray-500">{r.department || '—'}</td>
                    <td className="text-xs text-gray-500">{r.patient_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <div className="p-3 text-center text-xs text-gray-400">
                Showing first 50 of {rows.length} records
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Import Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="stat-card text-center border-l-4 border-[#1B3A6B]">
              <div className="text-xs text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{result.total}</div>
            </div>
            <div className="stat-card text-center border-l-4 border-green-500">
              <div className="text-xs text-gray-500">Processed</div>
              <div className="text-2xl font-bold text-green-600">{result.processed}</div>
            </div>
            <div className="stat-card text-center border-l-4 border-red-500">
              <div className="text-xs text-gray-500">Skipped</div>
              <div className="text-2xl font-bold text-red-600">{result.skipped}</div>
            </div>
            <div className="stat-card text-center border-l-4 border-[#0D7E8A]">
              <div className="text-xs text-gray-500">Auto-Indents</div>
              <div className="text-2xl font-bold text-[#0D7E8A]">{result.indents_created}</div>
            </div>
          </div>

          {result.processed > 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-100 mb-4">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">
                Successfully deducted stock for {result.processed} items. Stock ledger updated.
              </p>
            </div>
          )}

          {result.indents_created > 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-50 border border-blue-100 mb-4">
              <AlertTriangle size={18} className="text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                {result.indents_created} purchase indent(s) auto-created for items that fell below reorder level.{' '}
                <Link href="/purchase-orders/indents" className="underline font-medium">View Indents</Link>
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Errors ({result.errors.length})</h3>
              <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i}>
                        <td className="text-sm font-mono">{err.row}</td>
                        <td className="text-sm text-red-600">{err.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 flex-wrap">
            <button onClick={() => { setResult(null); setRows([]); setFileName('') }} className="btn-primary">
              Import Another File
            </button>
            <Link href="/items/stock" className="btn-secondary">View Stock Levels</Link>
          </div>
        </div>
      )}
    </div>
  )
}
