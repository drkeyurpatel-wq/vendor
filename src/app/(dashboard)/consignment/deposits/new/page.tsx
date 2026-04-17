'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'

const CATEGORIES = [
  { value: 'cardiac_stent', label: 'Cardiac Stent' },
  { value: 'ortho_implant', label: 'Ortho Implant' },
  { value: 'pacemaker', label: 'Pacemaker' },
  { value: 'surgical_consumable', label: 'Surgical Consumable' },
  { value: 'other', label: 'Other' },
]

interface StockLine {
  mode: 'item' | 'custom'
  itemId: string
  customDescription: string
  category: string
  brand: string
  sizeSpec: string
  lotNumber: string
  batchNumber: string
  serialNumber: string
  expiryDate: string
  vendorRate: string
  mrp: string
  qty: string
}

const emptyLine = (): StockLine => ({
  mode: 'custom', itemId: '', customDescription: '', category: 'cardiac_stent',
  brand: '', sizeSpec: '', lotNumber: '', batchNumber: '', serialNumber: '',
  expiryDate: '', vendorRate: '', mrp: '', qty: '1',
})

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
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<StockLine[]>([emptyLine()])

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: c }, { data: i }] = await Promise.all([
        supabase.from('vendors').select('id, legal_name, vendor_code').eq('status', 'active').is('deleted_at', null).order('legal_name'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
        supabase.from('items').select('id, item_code, generic_name, unit, gst_percent').is('deleted_at', null).order('generic_name'),
      ])
      setVendors(v || []); setCentres(c || []); setItems(i || [])
    }
    load()
  }, [])

  function updateLine(idx: number, field: keyof StockLine, value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function addLine() { setLines(prev => [...prev, emptyLine()]) }
  function removeLine(idx: number) { if (lines.length > 1) setLines(prev => prev.filter((_, i) => i !== idx)) }

  function duplicateLine(idx: number) {
    setLines(prev => {
      const copy = { ...prev[idx], serialNumber: '', lotNumber: '' }
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }

  function handleBarcodeScan(code: string) {
    const match = items.find(i => i.item_code === code || i.item_code?.toLowerCase() === code.toLowerCase())
    if (match) {
      const emptyIdx = lines.findIndex(l => !l.itemId && !l.customDescription)
      if (emptyIdx >= 0) {
        updateLine(emptyIdx, 'itemId', match.id)
        updateLine(emptyIdx, 'mode', 'item')
      } else {
        setLines(prev => [...prev, { ...emptyLine(), mode: 'item', itemId: match.id }])
      }
      toast.success(`Added: ${match.generic_name}`)
    } else {
      toast.error(`Item not found for barcode: ${code}`)
    }
  }

  function isLineValid(l: StockLine): boolean {
    const hasItem = l.mode === 'item' ? !!l.itemId : !!l.customDescription.trim()
    const hasRate = !!l.vendorRate && parseFloat(l.vendorRate) > 0
    return hasItem && hasRate
  }

  async function handleSubmit() {
    if (!vendorId) { toast.error('Select a vendor'); return }
    if (!centreId) { toast.error('Select a centre'); return }

    const validLines = lines.filter(isLineValid)
    if (validLines.length === 0) { toast.error('Add at least one item with a vendor rate'); return }

    // Warn about lines without rate
    const noRateCount = lines.filter(l => (l.itemId || l.customDescription) && (!l.vendorRate || parseFloat(l.vendorRate) <= 0)).length
    if (noRateCount > 0 && !confirm(`${noRateCount} item(s) have no vendor rate and will be skipped. Continue?`)) {
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date()
    const yyMM = format(now, 'yyMM')
    const { count } = await supabase.from('consignment_deposits').select('*', { count: 'exact', head: true })
    const depNumber = `H1-CD-${yyMM}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { data: deposit, error } = await supabase.from('consignment_deposits').insert({
      deposit_number: depNumber, vendor_id: vendorId, centre_id: centreId,
      challan_number: challanNumber || null, challan_date: challanDate || null,
      received_by: user?.id, location: location || null,
      notes: notes || null, status: 'active',
    }).select().single()

    if (error || !deposit) { toast.error(error?.message || 'Failed'); setLoading(false); return }

    const stockRows = validLines.map(l => {
      const isCustom = l.mode === 'custom'
      const itemName = isCustom
        ? l.customDescription.trim()
        : items.find(i => i.id === l.itemId)?.generic_name || 'Unknown item'

      return {
        deposit_id: deposit.id,
        item_id: isCustom ? null : l.itemId,
        item_description: itemName,
        category: l.category || 'other',
        brand: l.brand.trim() || null,
        size_spec: l.sizeSpec.trim() || null,
        lot_number: l.lotNumber.trim() || null,
        batch_number: l.batchNumber.trim() || null,
        serial_number: l.serialNumber.trim() || null,
        expiry_date: l.expiryDate || null,
        vendor_rate: parseFloat(l.vendorRate),
        mrp: l.mrp ? parseFloat(l.mrp) : null,
        qty_deposited: parseInt(l.qty) || 1,
        qty_used: 0, qty_returned: 0, status: 'available',
      }
    })

    const { error: stockErr } = await supabase.from('consignment_stock').insert(stockRows)
    if (stockErr) {
      toast.error(`Items save failed: ${stockErr.message}`)
      setLoading(false)
      return
    }

    toast.success(`Deposit ${depNumber} — ${stockRows.length} items received`)
    router.push('/consignment')
  }

  const validCount = lines.filter(isLineValid).length
  const totalValue = lines.reduce((s, l) => s + (parseFloat(l.vendorRate || '0') * parseInt(l.qty || '1')), 0)

  return (
    <div className="max-w-5xl">
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">New Consignment Deposit</h1>
          <p className="page-subtitle">Record vendor delivery challan — items stay vendor-owned until used</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Deposit ({validCount} items)</>}
        </button>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Deposit Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div><label className="form-label">Challan Date</label>
            <input type="date" className="form-input" value={challanDate} onChange={e => setChallanDate(e.target.value)} />
          </div>
          <div><label className="form-label">Vendor Challan / DC No.</label>
            <input className="form-input" value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="DC-12345" />
          </div>
          <div><label className="form-label">Storage Location</label>
            <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Cath Lab, OT Store" />
          </div>
          <div><label className="form-label">Notes</label>
            <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Rep name, contact..." />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Items Deposited</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{validCount} valid · <strong className="text-navy-600">{formatCurrency(totalValue)}</strong></span>
            <BarcodeScanButton onScan={handleBarcodeScan} label="Scan" scanType="item" />
            <button onClick={addLine} className="btn-secondary text-sm"><Plus size={14} /> Add Item</button>
          </div>
        </div>

        <div className="space-y-4">
          {lines.map((line, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              {/* Row 1: Mode toggle + Item selection/description */}
              <div className="flex items-start gap-3 mb-3">
                <button onClick={() => updateLine(idx, 'mode', line.mode === 'item' ? 'custom' : 'item')}
                  className="mt-6 text-xs text-gray-500 hover:text-navy-600 flex items-center gap-1 whitespace-nowrap shrink-0"
                  title={line.mode === 'item' ? 'Switch to custom description' : 'Switch to item catalogue'}>
                  {line.mode === 'item' ? <ToggleRight size={16} className="text-teal-500" /> : <ToggleLeft size={16} />}
                  {line.mode === 'item' ? 'Catalogue' : 'Custom'}
                </button>

                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 uppercase">{line.mode === 'item' ? 'Item (from catalogue) *' : 'Item Description *'}</label>
                  {line.mode === 'item' ? (
                    <select className="form-select text-sm" value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}>
                      <option value="">Select...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.item_code} — {i.generic_name}</option>)}
                    </select>
                  ) : (
                    <input className="form-input text-sm" value={line.customDescription}
                      onChange={e => updateLine(idx, 'customDescription', e.target.value)}
                      placeholder="e.g. Synergy Shield SN DES Stent, Corsair Pro Micro Catheter" />
                  )}
                </div>

                <div className="w-36 shrink-0">
                  <label className="text-[10px] text-gray-500 uppercase">Category</label>
                  <select className="form-select text-sm" value={line.category} onChange={e => updateLine(idx, 'category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>

                <div className="flex items-end gap-1 mt-5 shrink-0">
                  <button onClick={() => duplicateLine(idx)} className="p-1.5 text-gray-400 hover:text-teal-600" title="Duplicate (same item, new serial)">
                    <Copy size={14} />
                  </button>
                  {lines.length > 1 && <button onClick={() => removeLine(idx)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
                </div>
              </div>

              {/* Row 2: Details */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase">Brand</label>
                  <input className="form-input text-sm" value={line.brand} onChange={e => updateLine(idx, 'brand', e.target.value)} placeholder="e.g. Boston Scientific" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase">Size / Spec</label>
                  <input className="form-input text-sm" value={line.sizeSpec} onChange={e => updateLine(idx, 'sizeSpec', e.target.value)} placeholder="e.g. 2.50x28mm" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase">Lot No.</label>
                  <input className="form-input text-sm" value={line.lotNumber} onChange={e => updateLine(idx, 'lotNumber', e.target.value)} placeholder="LOT-XXX" />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <label className="text-[10px] text-gray-500 uppercase">Expiry</label>
                  <input type="date" className="form-input text-sm" value={line.expiryDate} onChange={e => updateLine(idx, 'expiryDate', e.target.value)} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <label className="text-[10px] text-gray-500 uppercase">Qty</label>
                  <input type="number" className="form-input text-sm" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} min="1" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase">Vendor Rate (₹) *</label>
                  <input type="number" step="0.01" className="form-input text-sm" value={line.vendorRate} onChange={e => updateLine(idx, 'vendorRate', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase">MRP (₹)</label>
                  <input type="number" step="0.01" className="form-input text-sm" value={line.mrp} onChange={e => updateLine(idx, 'mrp', e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
