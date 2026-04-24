'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, Trash2, Save, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatCurrency } from '@/lib/utils'
import ItemSearch from '@/components/ui/ItemSearch'

interface ConsumptionLine {
  id: string; item_id: string; item_code: string; generic_name: string
  quantity: number; unit: string; rate: number; department: string
  ward: string; patient_name: string; ip_number: string; batch_number: string; notes: string
}

const DEPARTMENTS = ['Pharmacy', 'OT', 'ICU', 'Ward', 'ER', 'CSSD', 'Radiology', 'Lab', 'Other']
const WARDS = ['General Ward', 'Private Ward', 'ICU', 'NICU', 'PICU', 'SICU', 'CCU', 'Labour Room', 'OT-1', 'OT-2', 'OT-3', 'ER', 'Daycare']

export default function ConsumptionUploadPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [centres, setCentres] = useState<any[]>([])
  const [centreId, setCentreId] = useState('')
  const [consumptionDate, setConsumptionDate] = useState(new Date().toISOString().split('T')[0])
  const [lines, setLines] = useState<ConsumptionLine[]>([])
  const [mode, setMode] = useState<'manual' | 'csv'>('manual')
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: cens }] = await Promise.all([
        supabase.from('user_profiles').select('id, centre_id').eq('id', user.id).single(),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
      ])
      if (prof) { setProfile(prof); setCentreId(prof.centre_id || '') }
      if (cens) setCentres(cens)
    }
    load()
  }, [])

  function addItem(selected: any) {
    setLines(prev => [...prev, {
      id: crypto.randomUUID(), item_id: selected.id, item_code: selected.item_code,
      generic_name: selected.generic_name, quantity: 1, unit: selected.unit,
      rate: selected.default_rate || 0, department: 'Pharmacy', ward: '',
      patient_name: '', ip_number: '', batch_number: '', notes: '',
    }])
  }

  function updateLine(id: string, field: string, value: any) {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l.id !== id))
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string

      // ── Proper CSV parser: handles quoted fields with commas inside ──
      function parseCSVLine(line: string): string[] {
        const fields: string[] = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; continue }
            if (ch === '"') { inQuotes = false; continue }
            current += ch
          } else {
            if (ch === '"') { inQuotes = true; continue }
            if (ch === ',') { fields.push(current.trim()); current = ''; continue }
            current += ch
          }
        }
        fields.push(current.trim())
        return fields
      }

      const rawLines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())

      // ── Auto-detect header row: find the line containing known eClinicalWorks column names ──
      const KNOWN_HEADERS = ['sr. no', 'item name', 'closing balance', 'opening balance', 'issue qty']
      let headerIdx = -1
      for (let i = 0; i < Math.min(rawLines.length, 10); i++) {
        const lower = rawLines[i].toLowerCase()
        const matchCount = KNOWN_HEADERS.filter(h => lower.includes(h)).length
        if (matchCount >= 3) { headerIdx = i; break }
      }
      if (headerIdx === -1) {
        // Fallback: treat first row as header
        headerIdx = 0
        toast.error('Could not detect header row — check column mapping')
      }

      const headers = parseCSVLine(rawLines[headerIdx]).map(h => h.toLowerCase().trim())

      const parsed = rawLines.slice(headerIdx + 1).filter(l => l.trim()).map(line => {
        const fields = parseCSVLine(line)
        const obj: any = {}
        headers.forEach((h, i) => { obj[h] = (fields[i] || '').replace(/&amp;/g, '&') })
        return obj
      }).filter(row => {
        // Filter out empty rows — must have at least sr. no or item name
        const sr = row['sr. no'] || row['sr.no'] || ''
        const name = row['item name'] || ''
        return sr || name
      })

      setCsvPreview(parsed)
      setMode('csv')
      toast.success(`${parsed.length} rows parsed from CSV (header at row ${headerIdx + 1})`)
    }
    reader.readAsText(file)
  }

  async function handleSubmit() {
    if (!centreId) { toast.error('Select a centre'); return }
    if (mode === 'manual' && lines.length === 0) { toast.error('Add at least one item'); return }
    if (mode === 'csv' && csvPreview.length === 0) { toast.error('Upload a CSV file'); return }

    setLoading(true)
    const batchId = `CONS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36)}`

    try {
      let records: any[] = []
      let unmatched = 0
      const source = mode === 'manual' ? 'manual' : 'csv_upload'

      if (mode === 'manual') {
        records = lines.map(l => ({
          item_id: l.item_id,
          consumption_date: consumptionDate,
          department: l.department,
          ward: l.ward || null,
          quantity: l.quantity,
          unit: l.unit,
          rate: l.rate || null,
          patient_name: l.patient_name || null,
          ip_number: l.ip_number || null,
          batch_number: l.batch_number || null,
          notes: l.notes || null,
        }))
      } else {
        // CSV mode — batch-fetch ALL items once, match locally (NOT 380 individual queries)
        toast('Matching items...', { icon: '🔍' })
        const { data: allItems } = await supabase
          .from('items')
          .select('id, item_code, generic_name')
          .eq('is_active', true)
          .limit(15000)

        // Build lookup maps: exact name match (case-insensitive) + item_code
        const nameMap = new Map<string, string>() // lowercase name → id
        const codeMap = new Map<string, string>() // item_code → id
        ;(allItems ?? []).forEach((item: any) => {
          if (item.generic_name) nameMap.set(item.generic_name.toLowerCase().trim(), item.id)
          if (item.item_code) codeMap.set(item.item_code.toLowerCase().trim(), item.id)
        })

        for (const row of csvPreview) {
          const code = (row.item_code || row.code || '').trim()
          const name = (row['item name'] || row.item_name || row.generic_name || row.name || '').trim()
          const qty = parseFloat(row['issue qty'] || row.quantity || row.qty || '0')
          if (qty <= 0) continue

          // Match: 1. item_code exact → 2. generic_name exact (case-insensitive)
          let itemId = code ? codeMap.get(code.toLowerCase()) || null : null
          if (!itemId && name) {
            itemId = nameMap.get(name.toLowerCase()) || null
          }
          // 3. Fuzzy: try without trailing dosage info
          if (!itemId && name) {
            const simpleName = name.replace(/\s*\(.*$/, '').toLowerCase().trim()
            itemId = nameMap.get(simpleName) || null
          }
          if (!itemId) { unmatched++; continue }

          // Parse eClinicalWorks date (DD/MM/YYYY) → YYYY-MM-DD
          const rawDate = row['transaction date'] || row.date || ''
          let parsedDate = consumptionDate
          if (rawDate && rawDate.includes('/')) {
            const parts = rawDate.split('/')
            if (parts.length === 3) parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          } else if (rawDate && rawDate.includes('-')) {
            parsedDate = rawDate
          }

          records.push({
            item_id: itemId,
            consumption_date: parsedDate,
            department: row.department || 'Pharmacy',
            ward: row.ward || null,
            quantity: qty,
            unit: row.unit || 'Nos',
            rate: parseFloat(row.rate || '0') || null,
            patient_name: row.patient_name || null,
            ip_number: row.ip_number || null,
            batch_number: row.batch_number || row.batch || null,
          })
        }
      }

      if (records.length === 0) {
        toast.error(unmatched > 0 ? `All ${unmatched} items unmatched — nothing to save` : 'No valid records')
        setLoading(false)
        return
      }

      // Call server API — inserts consumption_records + deducts stock + writes ledger
      const res = await fetch('/api/consumption/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreId,
          consumption_date: consumptionDate,
          upload_batch_id: batchId,
          source,
          records,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Upload failed')
        setLoading(false)
        return
      }

      // Show result summary
      const parts: string[] = [`${result.records_saved} records saved`]
      if (result.stock_deducted > 0) parts.push(`${result.stock_deducted} stock deducted`)
      if (result.stock_failed > 0) parts.push(`${result.stock_failed} stock errors`)
      if (unmatched > 0) parts.push(`${unmatched} unmatched skipped`)
      toast.success(parts.join(' · ') + ` — Batch: ${batchId}`)

      if (result.stock_failed > 0) {
        toast(`${result.stock_failed} item(s) could not be deducted from stock — check if stock records exist`, { icon: '⚠️', duration: 6000 })
      }

      // Auto-reorder notification
      if (result.auto_pos_created > 0) {
        const poNames = result.auto_pos?.map((p: any) => p.po_number).join(', ') || ''
        toast(`Auto-reorder: ${result.auto_pos_created} draft PO(s) created — ${poNames}. Review in Purchase Orders.`, { icon: '🔄', duration: 8000 })
      } else if (result.reorder_triggered > 0) {
        toast(`${result.reorder_triggered} item(s) hit reorder level but no L1 vendor mapped — set up vendor-item mapping to enable auto-PO`, { icon: '⚠️', duration: 6000 })
      }

      router.push('/items/consumption')
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0)
  const totalValue = lines.reduce((s, l) => s + l.quantity * (l.rate || 0), 0)

  return (
    <div>
      <Link href="/items/consumption" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back to Consumption Report</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Daily Consumption</h1>
          <p className="page-subtitle">Record items consumed today — manual entry or CSV upload</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Consumption</>}
        </button>
      </div>

      {/* Settings */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Centre *</label>
            <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
              <option value="">Select centre</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Consumption Date *</label>
            <input type="date" className="form-input" value={consumptionDate} onChange={e => setConsumptionDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Upload Mode</label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setMode('manual')}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium border', mode === 'manual' ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
                <Plus size={14} className="inline mr-1" /> Manual
              </button>
              <button onClick={() => { setMode('csv'); fileRef.current?.click() }}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium border', mode === 'csv' ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
                <FileSpreadsheet size={14} className="inline mr-1" /> CSV
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleCSV} />
          </div>
          {mode === 'manual' && (
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-navy-600">{lines.length}</span> items · 
                <span className="font-semibold text-navy-600"> {totalQty}</span> units · 
                <span className="font-semibold text-navy-600"> {formatCurrency(totalValue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry */}
      {mode === 'manual' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <ItemSearch onSelect={addItem} excludeIds={[]} placeholder="Search item to add consumption..." />
          </div>
          {lines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>
                  <th>Item</th><th>Dept</th><th>Ward</th><th className="text-right w-20">Qty</th>
                  <th className="text-right w-24">Rate</th><th>Patient</th><th>IP#</th><th>Batch</th><th className="w-10"></th>
                </tr></thead>
                <tbody>
                  {lines.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div className="font-medium text-sm text-gray-900">{l.generic_name}</div>
                        <div className="text-[10px] text-gray-500">{l.item_code} · {l.unit}</div>
                      </td>
                      <td>
                        <select className="form-select text-xs" value={l.department} onChange={e => updateLine(l.id, 'department', e.target.value)}>
                          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="form-select text-xs" value={l.ward} onChange={e => updateLine(l.id, 'ward', e.target.value)}>
                          <option value="">—</option>
                          {WARDS.map(w => <option key={w}>{w}</option>)}
                        </select>
                      </td>
                      <td><input type="number" min="1" className="form-input w-20 text-right text-sm" value={l.quantity} onChange={e => updateLine(l.id, 'quantity', parseInt(e.target.value) || 0)} /></td>
                      <td><input type="number" step="0.01" className="form-input w-24 text-right text-sm" value={l.rate || ''} onChange={e => updateLine(l.id, 'rate', parseFloat(e.target.value) || 0)} /></td>
                      <td><input className="form-input text-xs" value={l.patient_name} onChange={e => updateLine(l.id, 'patient_name', e.target.value)} placeholder="Name" /></td>
                      <td><input className="form-input text-xs w-20" value={l.ip_number} onChange={e => updateLine(l.id, 'ip_number', e.target.value)} placeholder="IP#" /></td>
                      <td><input className="form-input text-xs w-20" value={l.batch_number} onChange={e => updateLine(l.id, 'batch_number', e.target.value)} placeholder="Batch" /></td>
                      <td><button onClick={() => removeLine(l.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {lines.length === 0 && (
            <div className="py-16 text-center text-gray-500 text-sm">Search and add items above to record consumption</div>
          )}
        </div>
      )}

      {/* CSV Preview */}
      {mode === 'csv' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy-600">CSV Preview ({csvPreview.length} rows)</h2>
            <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs"><Upload size={12} /> Upload Different File</button>
          </div>
          {csvPreview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead><tr>{Object.keys(csvPreview[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                <tbody>
                  {csvPreview.slice(0, 20).map((row, i) => (
                    <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.length > 20 && <p className="text-xs text-gray-500 p-3">...and {csvPreview.length - 20} more rows</p>}
            </div>
          ) : (
            <div className="py-16 text-center">
              <FileSpreadsheet size={32} className="text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Upload a CSV with columns: item_code, quantity, rate, department, ward, patient_name, ip_number, batch_number</p>
              <button onClick={() => fileRef.current?.click()} className="btn-primary text-sm mt-4"><Upload size={14} /> Choose CSV File</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
