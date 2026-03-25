'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const CATEGORIES = [
  { value: 'cardiac_stent', label: 'Cardiac Stent (DES/BMS)' },
  { value: 'ortho_implant', label: 'Ortho Implant' },
  { value: 'pacemaker', label: 'Pacemaker / Cardiac Device' },
  { value: 'surgical_consumable', label: 'Surgical Consumable' },
  { value: 'other', label: 'Other' },
]

interface LineItem {
  key: string; item_description: string; category: string; brand: string; model_number: string;
  serial_number: string; lot_number: string; batch_number: string; expiry_date: string;
  size_spec: string; mrp: string; vendor_rate: string; gst_percent: string; qty: string; location: string
}

function emptyLine(): LineItem {
  return { key: Date.now().toString(), item_description: '', category: 'cardiac_stent', brand: '', model_number: '',
    serial_number: '', lot_number: '', batch_number: '', expiry_date: '', size_spec: '', mrp: '', vendor_rate: '',
    gst_percent: '12', qty: '1', location: 'Cathlab Store' }
}

export default function NewDepositPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [vendorId, setVendorId] = useState('')
  const [centreId, setCentreId] = useState('')
  const [challanNumber, setChallanNumber] = useState('')
  const [challanDate, setChallanDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([emptyLine()])

  useEffect(() => {
    async function load() {
      const [{ data: v }, { data: c }] = await Promise.all([
        supabase.from('vendors').select('id, legal_name, vendor_code').eq('is_active', true).order('legal_name'),
        supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
      ])
      setVendors(v || []); setCentres(c || [])
    }
    load()
  }, [])

  function updateItem(key: string, field: keyof LineItem, value: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i))
  }

  function addItem() { setItems(prev => [...prev, emptyLine()]) }
  function removeItem(key: string) { if (items.length > 1) setItems(prev => prev.filter(i => i.key !== key)) }

  async function handleSubmit() {
    if (!vendorId) { toast.error('Select a vendor'); return }
    if (!centreId) { toast.error('Select a centre'); return }
    if (!challanNumber.trim()) { toast.error('Challan number required'); return }
    const validItems = items.filter(i => i.item_description.trim() && parseFloat(i.vendor_rate) > 0)
    if (validItems.length === 0) { toast.error('Add at least one item with description and rate'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Generate deposit number
    const yyMM = format(new Date(), 'yyMM')
    const { count } = await supabase.from('consignment_deposits').select('*', { count: 'exact', head: true })
    const depNumber = `H1-CON-${yyMM}-${String((count ?? 0) + 1).padStart(3, '0')}`

    // Create deposit
    const { data: deposit, error: depError } = await supabase.from('consignment_deposits').insert({
      deposit_number: depNumber, vendor_id: vendorId, centre_id: centreId,
      challan_number: challanNumber.trim(), challan_date: challanDate,
      received_by: user?.id, notes: notes.trim() || null,
    }).select('id').single()

    if (depError || !deposit) { toast.error(depError?.message || 'Failed'); setLoading(false); return }

    // Create stock items
    const stockRows = validItems.map(i => ({
      deposit_id: deposit.id,
      item_description: i.item_description.trim(),
      category: i.category,
      brand: i.brand.trim() || null,
      model_number: i.model_number.trim() || null,
      serial_number: i.serial_number.trim() || null,
      lot_number: i.lot_number.trim() || null,
      batch_number: i.batch_number.trim() || null,
      expiry_date: i.expiry_date || null,
      size_spec: i.size_spec.trim() || null,
      mrp: i.mrp ? parseFloat(i.mrp) : null,
      vendor_rate: parseFloat(i.vendor_rate),
      gst_percent: parseFloat(i.gst_percent) || 12,
      qty_deposited: parseInt(i.qty) || 1,
      location: i.location.trim() || null,
    }))

    const { error: stockError } = await supabase.from('consignment_stock').insert(stockRows)
    if (stockError) { toast.error(stockError.message); setLoading(false); return }

    toast.success(`Deposit ${depNumber} — ${validItems.length} items received`)
    router.push('/consignment')
  }

  const totalValue = items.reduce((s, i) => s + (parseFloat(i.vendor_rate) || 0) * (parseInt(i.qty) || 0), 0)

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Receive Consignment Challan</h1>
          <p className="page-subtitle">Record vendor delivery of consignment items (stents, implants, devices)</p>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Deposit</>}
        </button>
      </div>

      {/* Header fields */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Vendor & Challan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Vendor *</label>
            <select className="form-select" value={vendorId} onChange={e => setVendorId(e.target.value)}>
              <option value="">Select vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_code} — {v.legal_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Centre *</label>
            <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
              <option value="">Select centre...</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Challan Number *</label>
            <input className="form-input" value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="Vendor DC number" />
          </div>
          <div>
            <label className="form-label">Challan Date</label>
            <input type="date" className="form-input" value={challanDate} onChange={e => setChallanDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="form-label">Notes</label>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Delivery by vendor rep Suresh, received at cathlab store" />
        </div>
      </div>

      {/* Items */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Consignment Items</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Total: <strong className="text-[#1B3A6B]">₹{totalValue.toLocaleString('en-IN')}</strong></span>
            <button onClick={addItem} className="btn-secondary text-sm"><Plus size={14} /> Add Item</button>
          </div>
        </div>

        <div className="space-y-6">
          {items.map((item, idx) => (
            <div key={item.key} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">Item #{idx + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.key)} className="text-xs text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase">Item Description *</label>
                  <input className="form-input text-sm" value={item.item_description} onChange={e => updateItem(item.key, 'item_description', e.target.value)} placeholder="e.g. Xience Sierra DES 3.0×28mm" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Category</label>
                  <select className="form-select text-sm" value={item.category} onChange={e => updateItem(item.key, 'category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Brand</label>
                  <input className="form-input text-sm" value={item.brand} onChange={e => updateItem(item.key, 'brand', e.target.value)} placeholder="e.g. Abbott" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Model / Size</label>
                  <input className="form-input text-sm" value={item.size_spec} onChange={e => updateItem(item.key, 'size_spec', e.target.value)} placeholder="e.g. 3.0×28mm" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Serial Number</label>
                  <input className="form-input text-sm" value={item.serial_number} onChange={e => updateItem(item.key, 'serial_number', e.target.value)} placeholder="Unique device ID" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Lot / Batch</label>
                  <input className="form-input text-sm" value={item.batch_number} onChange={e => updateItem(item.key, 'batch_number', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Expiry Date</label>
                  <input type="date" className="form-input text-sm" value={item.expiry_date} onChange={e => updateItem(item.key, 'expiry_date', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Vendor Rate (₹) *</label>
                  <input type="number" step="0.01" className="form-input text-sm" value={item.vendor_rate} onChange={e => updateItem(item.key, 'vendor_rate', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">MRP (₹)</label>
                  <input type="number" step="0.01" className="form-input text-sm" value={item.mrp} onChange={e => updateItem(item.key, 'mrp', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">GST %</label>
                  <input type="number" className="form-input text-sm" value={item.gst_percent} onChange={e => updateItem(item.key, 'gst_percent', e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase">Qty</label>
                  <input type="number" className="form-input text-sm" value={item.qty} onChange={e => updateItem(item.key, 'qty', e.target.value)} min="1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
