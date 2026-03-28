'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, X, Loader2 } from 'lucide-react'
import VendorSearch from '@/components/ui/VendorSearch'

interface Props {
  itemId: string
  existingVendorIds: string[]
}

export default function AddVendorMapping({ itemId, existingVendorIds }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<any>(null)
  const [lRank, setLRank] = useState('1')
  const [rate, setRate] = useState('')

  async function handleSubmit() {
    if (!selectedVendor) { toast.error('Select a vendor'); return }
    if (existingVendorIds.includes(selectedVendor.id)) { toast.error('This vendor is already mapped'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/vendor-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: selectedVendor.id,
          item_id: itemId,
          l_rank: parseInt(lRank),
          last_quoted_rate: rate ? parseFloat(rate) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${selectedVendor.legal_name} mapped as L${data.l_rank}`)
      setOpen(false)
      setSelectedVendor(null)
      setRate('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to map vendor')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors cursor-pointer"
      >
        <Plus size={14} /> Add Vendor
      </button>
    )
  }

  return (
    <div className="border border-teal-200 bg-teal-50/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Map a Vendor to this Item</span>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-200 cursor-pointer"><X size={16} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label className="form-label text-xs">Vendor</label>
          <VendorSearch
            value={selectedVendor}
            onChange={(v) => setSelectedVendor(v)}
            placeholder="Search vendor..."
          />
        </div>
        <div>
          <label className="form-label text-xs">L-Rank</label>
          <select className="form-select text-sm" value={lRank} onChange={e => setLRank(e.target.value)}>
            <option value="1">L1 (Preferred)</option>
            <option value="2">L2</option>
            <option value="3">L3</option>
          </select>
        </div>
        <div>
          <label className="form-label text-xs">Last Rate (₹)</label>
          <input type="number" step="0.01" className="form-input text-sm" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSubmit} disabled={loading || !selectedVendor} className="btn-primary text-xs cursor-pointer">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Map Vendor</>}
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary text-xs cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}
