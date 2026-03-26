'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'
import { format } from 'date-fns'

interface Centre {
  id: string
  code: string
  name: string
}

interface Vendor {
  id: string
  legal_name: string
  vendor_code: string
}

interface Item {
  id: string
  item_code: string
  generic_name: string
  unit: string
}

interface ContractItem {
  item_id: string
  item_name: string
  item_code: string
  unit: string
  rate: string
  gst_percent: string
  l_rank: string
}

export default function NewRateContractPage() {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [vendorId, setVendorId] = useState('')
  const [centreId, setCentreId] = useState('')
  const [contractType, setContractType] = useState('annual')
  const [validFrom, setValidFrom] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [validTo, setValidTo] = useState('')
  const [status, setStatus] = useState('draft')

  // Lookups
  const [centres, setCentres] = useState<Centre[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorResults, setVendorResults] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [itemSearch, setItemSearch] = useState('')
  const [itemResults, setItemResults] = useState<Item[]>([])

  // Contract items
  const [items, setItems] = useState<ContractItem[]>([])

  // Load centres
  useEffect(() => {
    supabase.from('centres').select('id, code, name').order('code').then(({ data }) => {
      setCentres(data || [])
    })
  }, [supabase])

  // Vendor search
  useEffect(() => {
    if (vendorSearch.length < 2) { setVendorResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, legal_name, vendor_code')
        .eq('status', 'active')
        .or(`legal_name.ilike.%${vendorSearch}%,vendor_code.ilike.%${vendorSearch}%`)
        .limit(10)
      setVendorResults(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [vendorSearch, supabase])

  // Item search
  useEffect(() => {
    if (itemSearch.length < 2) { setItemResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('items')
        .select('id, item_code, generic_name, unit')
        .eq('is_active', true)
        .or(`generic_name.ilike.%${itemSearch}%,item_code.ilike.%${itemSearch}%`)
        .limit(10)
      setItemResults(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [itemSearch, supabase])

  function addItem(item: Item) {
    if (items.some(i => i.item_id === item.id)) {
      toast.error('Item already added')
      return
    }
    setItems(prev => [...prev, {
      item_id: item.id,
      item_name: item.generic_name,
      item_code: item.item_code,
      unit: item.unit,
      rate: '',
      gst_percent: '12',
      l_rank: '1',
    }])
    setItemSearch('')
    setItemResults([])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof ContractItem, value: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!vendorId) { toast.error('Select a vendor'); return }
    if (!validFrom || !validTo) { toast.error('Set validity period'); return }
    if (items.length === 0) { toast.error('Add at least one item'); return }
    if (items.some(i => !i.rate || parseFloat(i.rate) <= 0)) {
      toast.error('All items must have a valid rate'); return
    }

    setSaving(true)
    try {
      // Generate contract number
      const { count } = await supabase
        .from('rate_contracts')
        .select('*', { count: 'exact', head: true })

      const contractNumber = `H1-RC-${format(new Date(), 'yyMM')}-${String((count ?? 0) + 1).padStart(3, '0')}`

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from('rate_contracts')
        .insert({
          contract_number: contractNumber,
          vendor_id: vendorId,
          centre_id: centreId || null,
          contract_type: contractType,
          valid_from: validFrom,
          valid_to: validTo,
          status,
        })
        .select()
        .single()

      if (contractError) throw contractError

      // Insert items
      const contractItems = items.map(i => ({
        contract_id: contract.id,
        item_id: i.item_id,
        rate: parseFloat(i.rate),
        unit: i.unit,
        gst_percent: parseFloat(i.gst_percent) || 0,
        l_rank: parseInt(i.l_rank) || 1,
      }))

      const { error: itemsError } = await supabase
        .from('rate_contract_items')
        .insert(contractItems)

      if (itemsError) throw itemsError

      // Audit log
      await supabase.from('activity_log').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'rate_contract_created',
        entity_type: 'rate_contract',
        entity_id: contract.id,
        details: { contract_number: contractNumber, vendor_id: vendorId, items_count: items.length },
      })

      toast.success(`Contract ${contractNumber} created`)
      router.push(`/settings/rate-contracts/${contract.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create contract')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Link href="/settings/rate-contracts" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Rate Contracts
      </Link>

      <div className="page-header mb-6">
        <div>
          <h1 className="page-title">New Rate Contract</h1>
          <p className="page-subtitle">Lock in vendor pricing with L1/L2/L3 ranking</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Contract Details */}
        <div className="card p-6 mb-6">
          <fieldset>
            <legend className="text-lg font-semibold text-navy-600 mb-4">Contract Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Vendor */}
              <div className="md:col-span-2 relative">
                <label htmlFor="vendor-search" className="form-label">Vendor *</label>
                {selectedVendor ? (
                  <div className="flex items-center gap-2 p-2 border rounded-lg bg-navy-50">
                    <span className="text-sm font-medium">{selectedVendor.legal_name}</span>
                    <span className="font-mono text-xs text-gray-500">({selectedVendor.vendor_code})</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedVendor(null); setVendorId('') }}
                      className="ml-auto text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      id="vendor-search"
                      type="text"
                      value={vendorSearch}
                      onChange={e => setVendorSearch(e.target.value)}
                      placeholder="Search vendor..."
                      className="form-input w-full"
                      autoComplete="off"
                    />
                    {vendorResults.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {vendorResults.map(v => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVendor(v)
                              setVendorId(v.id)
                              setVendorSearch('')
                              setVendorResults([])
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-navy-50 text-sm"
                          >
                            <span className="font-medium">{v.legal_name}</span>
                            <span className="text-xs text-gray-500 ml-2">({v.vendor_code})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Centre */}
              <div>
                <label htmlFor="centre" className="form-label">Centre</label>
                <select
                  id="centre"
                  value={centreId}
                  onChange={e => setCentreId(e.target.value)}
                  className="form-select w-full"
                >
                  <option value="">All Centres</option>
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label htmlFor="contract-type" className="form-label">Contract Type *</label>
                <select
                  id="contract-type"
                  value={contractType}
                  onChange={e => setContractType(e.target.value)}
                  className="form-select w-full"
                  aria-required="true"
                >
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="spot">Spot</option>
                </select>
              </div>

              {/* Valid From */}
              <div>
                <label htmlFor="valid-from" className="form-label">Valid From *</label>
                <input
                  id="valid-from"
                  type="date"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  className="form-input w-full"
                  aria-required="true"
                />
              </div>

              {/* Valid To */}
              <div>
                <label htmlFor="valid-to" className="form-label">Valid To *</label>
                <input
                  id="valid-to"
                  type="date"
                  value={validTo}
                  onChange={e => setValidTo(e.target.value)}
                  className="form-input w-full"
                  aria-required="true"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="form-select w-full"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
          </fieldset>
        </div>

        {/* Items */}
        <div className="card p-6 mb-6">
          <fieldset>
            <legend className="text-lg font-semibold text-navy-600 mb-4">
              Contract Items ({items.length})
            </legend>

            {/* Item Search */}
            <div className="relative mb-4">
              <label htmlFor="item-search" className="form-label">Add Item</label>
              <div className="flex gap-2">
                <input
                  id="item-search"
                  type="text"
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  placeholder="Search items by name or code..."
                  className="form-input w-full"
                  autoComplete="off"
                />
                <BarcodeScanButton onScan={async (code) => {
                  const { data } = await supabase.from('items').select('id, item_code, generic_name, brand_name, unit, gst_percent, manufacturer').eq('is_active', true).or(`item_code.eq.${code},item_code.ilike.${code}`).limit(1)
                  if (data?.[0]) { addItem(data[0]); toast.success(`Added: ${data[0].generic_name}`) }
                  else { setItemSearch(code); toast.error(`No match for "${code}"`) }
                }} label="Scan" scanType="item" />
              </div>
              {itemResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {itemResults.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item)}
                      className="block w-full text-left px-4 py-2 hover:bg-navy-50 text-sm"
                    >
                      <span className="font-mono text-xs text-gray-500 mr-2">{item.item_code}</span>
                      <span className="font-medium">{item.generic_name}</span>
                      <span className="text-xs text-gray-500 ml-2">({item.unit})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items Table */}
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Unit</th>
                      <th scope="col">Rate (₹) *</th>
                      <th scope="col">GST %</th>
                      <th scope="col">L-Rank</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.item_id}>
                        <td>
                          <div className="text-sm font-medium">{item.item_name}</div>
                          <div className="font-mono text-xs text-gray-500">{item.item_code}</div>
                        </td>
                        <td className="text-sm text-gray-600">{item.unit}</td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.rate}
                            onChange={e => updateItem(idx, 'rate', e.target.value)}
                            className="form-input w-24 text-right"
                            placeholder="0.00"
                            aria-label={`Rate for ${item.item_name}`}
                            required
                          />
                        </td>
                        <td>
                          <select
                            value={item.gst_percent}
                            onChange={e => updateItem(idx, 'gst_percent', e.target.value)}
                            className="form-select w-20"
                            aria-label={`GST for ${item.item_name}`}
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={item.l_rank}
                            onChange={e => updateItem(idx, 'l_rank', e.target.value)}
                            className="form-select w-16"
                            aria-label={`L-Rank for ${item.item_name}`}
                          >
                            <option value="1">L1</option>
                            <option value="2">L2</option>
                            <option value="3">L3</option>
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-600 p-1"
                            aria-label={`Remove ${item.item_name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Plus size={32} className="mx-auto mb-2" />
                <p className="text-sm">Search and add items above</p>
              </div>
            )}
          </fieldset>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/settings/rate-contracts" className="btn-secondary">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-1.5"
          >
            <Save size={16} />
            {saving ? 'Creating...' : 'Create Contract'}
          </button>
        </div>
      </form>
    </div>
  )
}
