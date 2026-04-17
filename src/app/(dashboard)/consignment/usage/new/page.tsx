'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'

export default function RecordUsagePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [availableStock, setAvailableStock] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [centreId, setCentreId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientUHID, setPatientUHID] = useState('')
  const [surgeonName, setSurgeonName] = useState('')
  const [otNumber, setOtNumber] = useState('')
  const [caseType, setCaseType] = useState('')
  const [usageDate, setUsageDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [qtyUsed, setQtyUsed] = useState('1')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: stock }, { data: c }] = await Promise.all([
        supabase.from('consignment_stock')
          .select('*, item:items(item_code, generic_name, unit, manufacturer), deposit:consignment_deposits(deposit_number, vendor_id, centre_id, vendor:vendors(legal_name, vendor_code), centre:centres(code, name))')
          .eq('status', 'available').order('created_at', { ascending: false }),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
      ])
      // Filter to items with qty remaining
      const filtered = (stock || []).filter(s => (s.qty_deposited - s.qty_used - s.qty_returned) > 0)
      setAvailableStock(filtered)
      setCentres(c || [])
      setPageLoading(false)
    }
    load()
  }, [])

  const filteredStock = search
    ? availableStock.filter(s =>
        (s.item?.generic_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.item_description || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.item?.item_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.serial_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.batch_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.lot_number || '').toLowerCase().includes(search.toLowerCase()))
    : availableStock

  async function handleSubmit() {
    if (!selectedStock) { toast.error('Select an item'); return }
    if (!patientName.trim()) { toast.error('Patient name required'); return }
    if (!centreId) { toast.error('Select centre'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date()
    const yyMM = format(now, 'yyMM')
    const { count } = await supabase.from('consignment_usage').select('*', { count: 'exact', head: true })
    const usageNum = `H1-CU-${yyMM}-${String((count ?? 0) + 1).padStart(4, '0')}`

    const { error } = await supabase.from('consignment_usage').insert({
      usage_number: usageNum,
      stock_id: selectedStock.id,
      deposit_id: selectedStock.deposit_id,
      centre_id: centreId,
      patient_name: patientName.trim(),
      patient_uhid: patientUHID.trim() || null,
      surgeon_name: surgeonName.trim() || null,
      ot_number: otNumber.trim() || null,
      case_type: caseType || null,
      usage_date: usageDate,
      qty_used: parseInt(qtyUsed) || 1,
      conversion_status: 'pending',
      notes: notes.trim() || null,
      created_by: user?.id,
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    // Immediately deduct from consignment_stock to prevent double-use
    const qtyNum = parseInt(qtyUsed) || 1
    const newQtyUsed = (selectedStock.qty_used || 0) + qtyNum
    const { error: stockErr } = await supabase.from('consignment_stock').update({
      qty_used: newQtyUsed,
      status: newQtyUsed >= selectedStock.qty_deposited ? 'used' : 'available',
    }).eq('id', selectedStock.id)

    if (stockErr) {
      console.error('Stock deduction failed:', stockErr.message)
    }

    toast.success(`Usage ${usageNum} recorded — pending PO/GRN/Invoice conversion`)
    router.push('/consignment/usage')
  }

  if (pageLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-navy-600" /></div>

  return (
    <div className="max-w-4xl">
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Record Consignment Usage</h1>
          <p className="page-subtitle">Log item used on patient — this will trigger PO + GRN + Invoice generation</p>
        </div>
        <button onClick={handleSubmit} disabled={loading || !selectedStock} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Record Usage</>}
        </button>
      </div>

      {/* Step 1: Select Item */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Step 1 — Select Consignment Item</h2>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="form-input pl-10" placeholder="Search by item name, code, serial number, batch..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <BarcodeScanButton onScan={(code) => {
            const match = availableStock.find(s =>
              s.serial_number === code || s.batch_number === code ||
              s.item?.item_code === code || s.item?.item_code?.toLowerCase() === code.toLowerCase()
            )
            if (match) {
              setSelectedStock(match)
              setCentreId(match.deposit?.centre_id || '')
              toast.success(`Selected: ${match.item?.generic_name} (SN: ${match.serial_number || match.batch_number || 'N/A'})`)
            } else {
              setSearch(code)
              toast.error(`No exact match — showing search results for "${code}"`)
            }
          }} label="Scan Item" scanType="item" />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredStock.length > 0 ? filteredStock.map(s => {
            const avail = s.qty_deposited - s.qty_used - s.qty_returned
            const isSelected = selectedStock?.id === s.id
            return (
              <div key={s.id} onClick={() => { setSelectedStock(s); setCentreId(s.deposit?.centre_id || '') }}
                className={cn('p-3 rounded-lg border-2 cursor-pointer transition-all',
                  isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-gray-300')}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{s.item?.generic_name || s.item_description || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{s.item?.item_code || s.lot_number || ''} | Batch: {s.batch_number || '—'} | SN: {s.serial_number || '—'} | Exp: {s.expiry_date ? formatDate(s.expiry_date) : '—'}{s.size_spec ? ` | ${s.size_spec}` : ''}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Vendor: {s.deposit?.vendor?.legal_name} | Deposit: {s.deposit?.deposit_number} | Centre: {s.deposit?.centre?.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-navy-600">{avail} avail</div>
                    <div className="text-xs text-gray-500">{formatCurrency(s.vendor_rate)}/unit</div>
                  </div>
                </div>
              </div>
            )
          }) : <p className="text-sm text-gray-500 text-center py-4">No available consignment items{search ? ' matching your search' : ''}</p>}
        </div>
      </div>

      {/* Step 2: Patient + Procedure */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Step 2 — Patient & Procedure Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="form-label">Patient Name *</label>
            <input className="form-input" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Full name" /></div>
          <div><label className="form-label">UHID (if available)</label>
            <input className="form-input" value={patientUHID} onChange={e => setPatientUHID(e.target.value)} placeholder="e.g. SHI-2026-12345" /></div>
          <div><label className="form-label">Surgeon</label>
            <input className="form-input" value={surgeonName} onChange={e => setSurgeonName(e.target.value)} placeholder="Dr. ..." /></div>
          <div><label className="form-label">OT / Cathlab Number</label>
            <input className="form-input" value={otNumber} onChange={e => setOtNumber(e.target.value)} placeholder="e.g. Cathlab 1, OT-3" /></div>
          <div><label className="form-label">Case Type</label>
            <select className="form-select" value={caseType} onChange={e => setCaseType(e.target.value)}>
              <option value="">Select...</option>
              <option value="PCI / Angioplasty">PCI / Angioplasty</option>
              <option value="Pacemaker Implant">Pacemaker Implant</option>
              <option value="CABG">CABG</option>
              <option value="Total Knee Replacement">Total Knee Replacement</option>
              <option value="Total Hip Replacement">Total Hip Replacement</option>
              <option value="Fracture Fixation">Fracture Fixation</option>
              <option value="Spine Surgery">Spine Surgery</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div><label className="form-label">Centre *</label>
            <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
              <option value="">Select...</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Usage Date</label>
            <input type="date" className="form-input" value={usageDate} onChange={e => setUsageDate(e.target.value)} /></div>
          <div><label className="form-label">Quantity Used</label>
            <input type="number" className="form-input" value={qtyUsed} onChange={e => setQtyUsed(e.target.value)} min="1" max={selectedStock ? String(selectedStock.qty_deposited - selectedStock.qty_used - selectedStock.qty_returned) : '99'} /></div>
        </div>
        {selectedStock && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">Amount:</span>{' '}
            <span className="font-bold text-navy-600">{formatCurrency((selectedStock.vendor_rate || 0) * (parseInt(qtyUsed) || 1))}</span>
            <span className="text-gray-500 ml-2">({formatCurrency(selectedStock.vendor_rate)} × {qtyUsed})</span>
          </div>
        )}
        <div className="mt-4"><label className="form-label">Notes</label>
          <textarea className="form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." /></div>
      </div>
    </div>
  )
}
