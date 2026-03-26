'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'

interface StockLine { itemId: string; batchNumber: string; serialNumber: string; expiryDate: string; vendorRate: string; mrp: string; qty: string }

export default function NewConsignmentDepositPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [vendorId, setVendorId] = useState('')
  const [centreId, setCentreId] = useState('')
  const [challanNumber, setChallanNumber] = useState('')
  const [challanDate, setChallanDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<StockLine[]>([{ itemId: '', batchNumber: '', serialNumber: '', expiryDate: '', vendorRate: '', mrp: '', qty: '1' }])

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: c }, { data: i }] = await Promise.all([
        supabase.from('vendors').select('id, legal_name, vendor_code').eq('is_active', true).order('legal_name'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
        supabase.from('items').select('id, item_code, generic_name, unit, gst_percent').order('generic_name'),
      ])
      setVendors(v || []); setCentres(c || []); setItems(i || [])
    }
    load()
  }, [])

  function updateLine(idx: number, field: keyof StockLine, value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLine() { setLines(prev => [...prev, { itemId: '', batchNumber: '', serialNumber: '', expiryDate: '', vendorRate: '', mrp: '', qty: '1' }]) }
  function removeLine(idx: number) { if (lines.length > 1) setLines(prev => prev.filter((_, i) => i !== idx)) }

  function handleBarcodeScan(code: string) {
    const match = items.find(i => i.item_code === code || i.item_code?.toLowerCase() === code.toLowerCase())
    if (match) {
      // Find empty line or add new
      const emptyIdx = lines.findIndex(l => !l.itemId)
      if (emptyIdx >= 0) {
        updateLine(emptyIdx, 'itemId', match.id)
      } else {
        setLines(prev => [...prev, { itemId: match.id, batchNumber: '', serialNumber: '', expiryDate: '', vendorRate: '', mrp: '', qty: '1' }])
      }
      toast.success(`Added: ${match.generic_name}`)
    } else {
      toast.error(`Item not found for barcode: ${code}`)
    }
  }

  async function handleSubmit() {
    if (!vendorId) { toast.error('Select a vendor'); return }
    if (!centreId) { toast.error('Select a centre'); return }
    if (!lines.some(l => l.itemId && l.vendorRate)) { toast.error('Add at least one item with rate'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date()
    const yyMM = format(now, 'yyMM')
    const { count } = await supabase.from('consignment_deposits').select('*', { count: 'exact', head: true })
    const depNumber = `H1-CD-${yyMM}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { data: deposit, error } = await supabase.from('consignment_deposits').insert({
      deposit_number: depNumber, vendor_id: vendorId, centre_id: centreId,
      challan_number: challanNumber || null, challan_date: challanDate || null,
      received_by: user?.id, notes: notes || null, status: 'active',
    }).select().single()

    if (error || !deposit) { toast.error(error?.message || 'Failed'); setLoading(false); return }

    const stockRows = lines.filter(l => l.itemId && l.vendorRate).map(l => ({
      deposit_id: deposit.id, item_id: l.itemId,
      batch_number: l.batchNumber || null, serial_number: l.serialNumber || null,
      expiry_date: l.expiryDate || null, vendor_rate: parseFloat(l.vendorRate),
      mrp: l.mrp ? parseFloat(l.mrp) : null, qty_deposited: parseInt(l.qty) || 1,
      qty_available: parseInt(l.qty) || 1,
      qty_used: 0, qty_returned: 0, status: 'available',
    }))

    await supabase.from('consignment_stock').insert(stockRows)

    toast.success(`Deposit ${depNumber} — ${stockRows.length} items received`)
    router.push('/consignment')
  }

  const totalValue = lines.reduce((s, l) => s + (parseFloat(l.vendorRate || '0') * parseInt(l.qty || '1')), 0)

  return (
    <div className="max-w-4xl">
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">New Consignment Deposit</h1>
          <p className="page-subtitle">Record vendor delivery challan — items stay vendor-owned until used</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Deposit</>}
        </button>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Deposit Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="form-label">Vendor *</label>
            <select className="form-select" value={vendorId} onChange={e => setVendorId(e.target.value)}>
              <option value="">Select vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_code} — {v.legal_name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Centre *</label>
            <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
              <option value="">Select centre...</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Vendor Challan No.</label>
            <input className="form-input" value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="DC-12345" />
          </div>
          <div><label className="form-label">Challan Date</label>
            <input type="date" className="form-input" value={challanDate} onChange={e => setChallanDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4"><label className="form-label">Notes</label>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. 3 DES stents from Medtronic rep Suresh, contact 98765..." />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Items Deposited</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Total: <strong className="text-navy-600">{formatCurrency(totalValue)}</strong></span>
            <BarcodeScanButton onScan={handleBarcodeScan} label="Scan Item" scanType="item" />
            <button onClick={addLine} className="btn-secondary text-sm"><Plus size={14} /> Add Item</button>
          </div>
        </div>
        <div className="space-y-4">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
              <div className="col-span-12 md:col-span-3">
                <label className="text-[10px] text-gray-500 uppercase">Item *</label>
                <select className="form-select text-sm" value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}>
                  <option value="">Select...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.item_code} — {i.generic_name}</option>)}
                </select>
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className="text-[10px] text-gray-500 uppercase">Qty</label>
                <input type="number" className="form-input text-sm" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} min="1" />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase">Batch / Lot</label>
                <input className="form-input text-sm" value={line.batchNumber} onChange={e => updateLine(idx, 'batchNumber', e.target.value)} placeholder="LOT-XXX" />
              </div>
              <div className="col-span-4 md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase">Serial No.</label>
                <input className="form-input text-sm" value={line.serialNumber} onChange={e => updateLine(idx, 'serialNumber', e.target.value)} placeholder="SN-XXX" />
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className="text-[10px] text-gray-500 uppercase">Expiry</label>
                <input type="date" className="form-input text-sm" value={line.expiryDate} onChange={e => updateLine(idx, 'expiryDate', e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <label className="text-[10px] text-gray-500 uppercase">Rate (₹) *</label>
                <input type="number" step="0.01" className="form-input text-sm" value={line.vendorRate} onChange={e => updateLine(idx, 'vendorRate', e.target.value)} placeholder="0" />
              </div>
              <div className="col-span-3 md:col-span-1">
                <label className="text-[10px] text-gray-500 uppercase">MRP (₹)</label>
                <input type="number" step="0.01" className="form-input text-sm" value={line.mrp} onChange={e => updateLine(idx, 'mrp', e.target.value)} placeholder="0" />
              </div>
              <div className="col-span-1 flex items-end">
                {lines.length > 1 && <button onClick={() => removeLine(idx)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
