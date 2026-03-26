'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportConfig {
  table: string
  label: string
  requiredColumns: string[]
  optionalColumns: string[]
  transformRow: (row: Record<string, string>, lookups: any) => Record<string, any> | null
  uniqueKey?: string
}

const IMPORT_CONFIGS: Record<string, ImportConfig> = {
  vendors: {
    table: 'vendors', label: 'Vendors',
    requiredColumns: ['vendor_code', 'legal_name', 'city', 'state'],
    optionalColumns: ['trade_name', 'gstin', 'pan', 'primary_contact_name', 'primary_contact_phone', 'primary_contact_email', 'credit_period_days', 'bank_name', 'bank_ifsc', 'bank_account_no', 'address', 'pincode'],
    uniqueKey: 'vendor_code',
    transformRow: (row) => ({
      vendor_code: row.vendor_code?.trim(), legal_name: row.legal_name?.trim(), trade_name: row.trade_name?.trim() || null,
      gstin: row.gstin?.trim() || null, pan: row.pan?.trim() || null,
      city: row.city?.trim(), state: row.state?.trim(), pincode: row.pincode?.trim() || null,
      primary_contact_name: row.primary_contact_name?.trim() || null,
      primary_contact_phone: row.primary_contact_phone?.trim() || null,
      primary_contact_email: row.primary_contact_email?.trim() || null,
      credit_period_days: parseInt(row.credit_period_days) || 30,
      bank_name: row.bank_name?.trim() || null, bank_ifsc: row.bank_ifsc?.trim() || null,
      bank_account_no: row.bank_account_no?.trim() || null, address: row.address?.trim() || null,
      status: 'active', bank_account_type: 'current',
    }),
  },
  items: {
    table: 'items', label: 'Items',
    requiredColumns: ['item_code', 'generic_name', 'unit'],
    optionalColumns: ['brand_name', 'manufacturer', 'hsn_code', 'gst_percent', 'is_cold_chain', 'is_narcotic', 'is_high_alert', 'dosage_form', 'strength'],
    uniqueKey: 'item_code',
    transformRow: (row) => ({
      item_code: row.item_code?.trim(), generic_name: row.generic_name?.trim(),
      brand_name: row.brand_name?.trim() || null, unit: row.unit?.trim() || 'nos',
      manufacturer: row.manufacturer?.trim() || null, hsn_code: row.hsn_code?.trim() || null,
      gst_percent: parseFloat(row.gst_percent) || 12,
      is_cold_chain: row.is_cold_chain?.toLowerCase() === 'true' || row.is_cold_chain === '1',
      is_narcotic: row.is_narcotic?.toLowerCase() === 'true' || row.is_narcotic === '1',
      is_high_alert: row.is_high_alert?.toLowerCase() === 'true' || row.is_high_alert === '1',
      is_active: true,
    }),
  },
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
  return { headers, rows }
}

export default function DataImportHandler() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importType, setImportType] = useState<string>('vendors')
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; total: number } | null>(null)

  const config = IMPORT_CONFIGS[importType]

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null); setErrors([])
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const data = parseCSV(text)
      if (data.rows.length === 0) { setErrors(['Empty CSV or no data rows']); return }

      // Validate required columns
      const missing = config.requiredColumns.filter(c => !data.headers.includes(c))
      if (missing.length > 0) {
        setErrors([`Missing required columns: ${missing.join(', ')}`])
        return
      }
      setParsed(data)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!parsed || !config) return
    setImporting(true); setErrors([])

    const transformedRows: Record<string, any>[] = []
    const rowErrors: string[] = []

    parsed.rows.forEach((row, idx) => {
      const missing = config.requiredColumns.filter(c => !row[c]?.trim())
      if (missing.length > 0) {
        rowErrors.push(`Row ${idx + 2}: missing ${missing.join(', ')}`)
        return
      }
      const transformed = config.transformRow(row, {})
      if (transformed) transformedRows.push(transformed)
    })

    if (transformedRows.length === 0) {
      setErrors(['No valid rows to import', ...rowErrors])
      setImporting(false)
      return
    }

    // Batch upsert in chunks of 50
    let success = 0, failed = 0
    for (let i = 0; i < transformedRows.length; i += 50) {
      const batch = transformedRows.slice(i, i + 50)
      const { data, error } = await supabase.from(config.table)
        .upsert(batch, { onConflict: config.uniqueKey || '' })
        .select('id')
      if (error) { failed += batch.length; rowErrors.push(`Batch ${Math.floor(i/50)+1}: ${error.message}`) }
      else { success += data?.length || 0 }
    }

    try {
      await supabase.from('audit_logs').insert({
        entity_type: config.table, entity_id: 'bulk_import',
        action: 'data_import',
        details: { type: importType, total: parsed.rows.length, success, failed },
      })
    } catch {}

    setResult({ success, failed, total: parsed.rows.length })
    setErrors(rowErrors)
    setImporting(false)
    if (success > 0) { toast.success(`${success} ${config.label.toLowerCase()} imported`); router.refresh() }
  }

  function downloadTemplate() {
    const allCols = [...config.requiredColumns, ...config.optionalColumns]
    const csv = allCols.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${importType}_template.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Import type selector */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(IMPORT_CONFIGS).map(([key, cfg]) => (
          <button key={key} onClick={() => { setImportType(key); setParsed(null); setResult(null); setErrors([]) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${importType === key ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Import {config.label} from CSV</h3>
            <p className="text-xs text-gray-500 mt-1">Required: {config.requiredColumns.join(', ')}</p>
          </div>
          <button onClick={downloadTemplate} className="btn-secondary text-sm">
            <Download size={14} /> Download Template
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          <FileSpreadsheet size={32} className="mx-auto text-gray-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Click to upload CSV file</p>
          <p className="text-xs text-gray-500 mt-1">Max 5,000 rows per import</p>
        </div>

        {/* Preview */}
        {parsed && !result && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">{parsed.rows.length} rows parsed</span>
              <div className="flex gap-2">
                <button onClick={() => { setParsed(null); if (fileRef.current) fileRef.current.value = '' }} className="btn-secondary text-sm"><X size={14} /> Clear</button>
                <button onClick={handleImport} disabled={importing} className="btn-primary text-sm">
                  {importing ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : <><Upload size={14} /> Import {parsed.rows.length} rows</>}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-60 border rounded-lg">
              <table className="data-table text-xs">
                <thead><tr>{parsed.headers.map(h => <th key={h} className={config.requiredColumns.includes(h) ? 'text-teal-700' : ''}>{h}</th>)}</tr></thead>
                <tbody>
                  {parsed.rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>{parsed.headers.map(h => <td key={h} className="text-gray-600">{row[h] || '—'}</td>)}</tr>
                  ))}
                  {parsed.rows.length > 10 && <tr><td colSpan={parsed.headers.length} className="text-center text-gray-500">... {parsed.rows.length - 10} more rows</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.failed > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.failed === 0 ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertTriangle size={18} className="text-yellow-600" />}
              <span className="font-medium text-gray-900">Import complete</span>
            </div>
            <div className="text-sm text-gray-700">
              {result.success} of {result.total} rows imported successfully.
              {result.failed > 0 && <span className="text-red-600 ml-1">{result.failed} failed.</span>}
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-700 mb-1">Errors:</div>
            {errors.slice(0, 10).map((e, i) => <div key={i} className="text-xs text-red-600">{e}</div>)}
            {errors.length > 10 && <div className="text-xs text-red-400 mt-1">... {errors.length - 10} more</div>}
          </div>
        )}
      </div>
    </div>
  )
}
