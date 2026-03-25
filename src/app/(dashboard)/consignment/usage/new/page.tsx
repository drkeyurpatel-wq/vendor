'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Search, Heart, Bone, Cpu, Scissors, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

const CAT_ICONS: Record<string, any> = { cardiac_stent: Heart, ortho_implant: Bone, pacemaker: Cpu, surgical_consumable: Scissors, other: Package }

export default function NewUsagePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [stock, setStock] = useState<any[]>([])
  const [filteredStock, setFilteredStock] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [centres, setCentres] = useState<any[]>([])

  // Usage form fields
  const [centreId, setCentreId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientUhid, setPatientUhid] = useState('')
  const [surgeonName, setSurgeonName] = useState('')
  const [procedureName, setProcedureName] = useState('')
  const [procedureDate, setProcedureDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [procedureLocation, setProcedureLocation] = useState('cathlab')
  const [qtyUsed, setQtyUsed] = useState('1')
  const [usageNotes, setUsageNotes] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: c }] = await Promise.all([
        supabase.from('consignment_stock')
          .select('*, deposit:consignment_deposits(deposit_number, vendor:vendors(legal_name), centre_id, centre:centres(code, name))')
          .eq('status', 'available').gt('qty_available', 0)
          .order('item_description'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
      ])
      setStock(s || []); setFilteredStock(s || []); setCentres(c || []); setPageLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!search.trim()) { setFilteredStock(stock); return }
    const q = search.toLowerCase()
    setFilteredStock(stock.filter(s =>
      s.item_description?.toLowerCase().includes(q) ||
      s.brand?.toLowerCase().includes(q) ||
      s.serial_number?.toLowerCase().includes(q) ||
      s.batch_number?.toLowerCase().includes(q) ||
      s.deposit?.vendor?.legal_name?.toLowerCase().includes(q)
    ))
  }, [search, stock])

  async function handleSubmit() {
    if (!selectedItem) { toast.error('Select an item from stock'); return }
    if (!patientName.trim()) { toast.error('Patient name required'); return }
    if (!surgeonName.trim()) { toast.error('Surgeon name required'); return }
    if (!centreId) { toast.error('Select centre'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const qty = parseInt(qtyUsed) || 1

    if (qty > selectedItem.qty_available) {
      toast.error(`Only ${selectedItem.qty_available} available`); setLoading(false); return
    }

    // Record usage
    const { data: usage, error } = await supabase.from('consignment_usage').insert({
      stock_id: selectedItem.id, deposit_id: selectedItem.deposit_id, centre_id: centreId,
      patient_name: patientName.trim(), patient_uhid: patientUhid.trim() || null,
      surgeon_name: surgeonName.trim(), procedure_name: procedureName.trim() || null,
      procedure_date: procedureDate, procedure_location: procedureLocation,
      qty_used: qty, usage_notes: usageNotes.trim() || null, logged_by: user?.id,
    }).select('id').single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Update stock
    await supabase.from('consignment_stock').update({
      qty_used: selectedItem.qty_used + qty,
      status: (selectedItem.qty_available - qty <= 0) ? 'used' : 'available',
    }).eq('id', selectedItem.id)

    // Update deposit status
    const { data: remainingStock } = await supabase.from('consignment_stock')
      .select('qty_available').eq('deposit_id', selectedItem.deposit_id)
    const totalRemaining = (remainingStock || []).reduce((s: number, i: any) => s + (i.qty_available || 0), 0) - qty
    if (totalRemaining <= 0) {
      await supabase.from('consignment_deposits').update({ status: 'fully_used' }).eq('id', selectedItem.deposit_id)
    } else {
      await supabase.from('consignment_deposits').update({ status: 'partially_used' }).eq('id', selectedItem.deposit_id)
    }

    // Auto-convert: trigger PO+GRN creation
    try {
      await fetch('/api/consignment/convert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage_id: usage.id }),
      })
    } catch {} // Non-blocking

    toast.success(`Usage logged — ${selectedItem.item_description}. PO generation triggered.`)
    router.push('/consignment/usage')
  }

  if (pageLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#1B3A6B]" /></div>

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Log Consignment Usage</h1>
          <p className="page-subtitle">Record implant / device used on patient — auto-generates PO + GRN</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Select item from stock */}
        <div>
          <div className="card p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">1. Select Item from Consignment Stock</h2>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="form-input pl-10" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by item, brand, serial, vendor..." />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filteredStock.map(s => {
                const Icon = CAT_ICONS[s.category] || Package
                const isSelected = selectedItem?.id === s.id
                return (
                  <button key={s.id} onClick={() => { setSelectedItem(s); if (s.deposit?.centre_id) setCentreId(s.deposit.centre_id) }}
                    className={cn('w-full text-left p-3 rounded-xl border-2 transition-all',
                      isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-100 hover:border-gray-300')}>
                    <div className="flex items-start gap-2">
                      <Icon size={14} className={cn('mt-0.5', isSelected ? 'text-teal-600' : 'text-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{s.item_description}</div>
                        <div className="text-xs text-gray-500">{s.brand} • {s.size_spec || s.serial_number || s.batch_number || ''}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-gray-400">{s.deposit?.vendor?.legal_name}</span>
                          <span className="text-xs font-semibold text-[#1B3A6B]">{formatCurrency(s.vendor_rate)}</span>
                          <span className="badge bg-green-50 text-green-700 text-[10px]">{s.qty_available} avail</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
              {filteredStock.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No matching items</p>}
            </div>
          </div>
        </div>

        {/* Right: Patient & procedure details */}
        <div>
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">2. Patient & Procedure Details</h2>

            {selectedItem && (
              <div className="p-3 mb-4 bg-teal-50 border border-teal-200 rounded-lg text-sm">
                <div className="font-semibold text-teal-800">{selectedItem.item_description}</div>
                <div className="text-xs text-teal-600">{selectedItem.brand} {selectedItem.size_spec} • S/N: {selectedItem.serial_number || '—'} • {formatCurrency(selectedItem.vendor_rate)}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Patient Name *</label>
                  <input className="form-input" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <label className="form-label">UHID</label>
                  <input className="form-input" value={patientUhid} onChange={e => setPatientUhid(e.target.value)} placeholder="Hospital ID" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Surgeon *</label>
                  <input className="form-input" value={surgeonName} onChange={e => setSurgeonName(e.target.value)} placeholder="Dr. name" />
                </div>
                <div>
                  <label className="form-label">Procedure</label>
                  <input className="form-input" value={procedureName} onChange={e => setProcedureName(e.target.value)} placeholder="e.g. PTCA, TKR" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={procedureDate} onChange={e => setProcedureDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Location</label>
                  <select className="form-select" value={procedureLocation} onChange={e => setProcedureLocation(e.target.value)}>
                    <option value="cathlab">Cathlab</option>
                    <option value="ot">OT</option>
                    <option value="minor_ot">Minor OT</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Qty</label>
                  <input type="number" className="form-input" value={qtyUsed} onChange={e => setQtyUsed(e.target.value)} min="1" max={selectedItem?.qty_available || 1} />
                </div>
              </div>
              <div>
                <label className="form-label">Centre *</label>
                <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
                  <option value="">Select...</option>
                  {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={usageNotes} onChange={e => setUsageNotes(e.target.value)} placeholder="Any remarks..." />
              </div>
              <button onClick={handleSubmit} disabled={loading || !selectedItem} className="btn-primary w-full">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Save size={16} /> Log Usage & Generate PO</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
