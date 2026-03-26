'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Minus, ArrowRightLeft, ShoppingCart, Loader2, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  itemId: string
  itemCode: string
  itemName: string
  centreId: string
  centreName: string
  currentStock: number
  reorderLevel: number
  maxLevel: number
  unit: string
  userRole: string
}

type DialogType = 'adjust' | 'transfer' | null

export default function StockActions({ itemId, itemCode, itemName, centreId, centreName, currentStock, reorderLevel, maxLevel, unit, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [dialog, setDialog] = useState<DialogType>(null)
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [transferCentre, setTransferCentre] = useState('')
  const [centres, setCentres] = useState<any[]>([])

  const canAdjust = ['group_admin', 'unit_cao', 'unit_purchase_manager', 'store_staff'].includes(userRole)
  const canTransfer = ['group_admin', 'unit_cao', 'unit_purchase_manager'].includes(userRole)

  async function openTransfer() {
    const { data } = await supabase.from('centres').select('id, code, name').eq('is_active', true).neq('id', centreId).order('code')
    setCentres(data || [])
    setDialog('transfer')
  }

  async function handleAdjust() {
    const q = parseInt(qty)
    if (!q || q <= 0) { toast.error('Enter a valid quantity'); return }
    if (adjustType === 'subtract' && q > currentStock) { toast.error(`Cannot subtract ${q} — only ${currentStock} ${unit} in stock`); return }
    if (!reason.trim()) { toast.error('Reason is required for stock adjustments'); return }

    setLoading(true)
    const newStock = adjustType === 'add' ? currentStock + q : currentStock - q

    const { error } = await supabase.from('item_centre_stock').update({
      current_stock: newStock,
      updated_at: new Date().toISOString(),
    }).eq('item_id', itemId).eq('centre_id', centreId)

    if (error) { toast.error(error.message); setLoading(false); return }

    // Log adjustment
    await supabase.from('stock_adjustments').insert({
      item_id: itemId, centre_id: centreId,
      adjustment_type: adjustType === 'add' ? 'receipt' : 'issue',
      quantity: q, reason, previous_stock: currentStock, new_stock: newStock,
    })
    // Also log to audit
    await supabase.from('audit_logs').insert({
      entity_type: 'stock', entity_id: `${itemId}_${centreId}`,
      action: `stock_${adjustType}`,
      details: { item_code: itemCode, centre: centreName, qty: q, from: currentStock, to: newStock, reason },
    })

    toast.success(`${adjustType === 'add' ? '+' : '-'}${q} ${unit} → ${newStock} ${unit} in stock`)
    setLoading(false); setDialog(null); setQty(''); setReason(''); router.refresh()
  }

  async function handleTransfer() {
    const q = parseInt(qty)
    if (!q || q <= 0) { toast.error('Enter quantity'); return }
    if (q > currentStock) { toast.error(`Only ${currentStock} ${unit} available`); return }
    if (!transferCentre) { toast.error('Select destination centre'); return }

    setLoading(true)

    // Deduct from source
    const { error: srcErr } = await supabase.from('item_centre_stock').update({
      current_stock: currentStock - q, updated_at: new Date().toISOString(),
    }).eq('item_id', itemId).eq('centre_id', centreId)

    if (srcErr) { toast.error(srcErr.message); setLoading(false); return }

    // Add to destination (upsert)
    const { data: destStock } = await supabase.from('item_centre_stock')
      .select('current_stock').eq('item_id', itemId).eq('centre_id', transferCentre).single()

    const destQty = (destStock?.current_stock || 0) + q
    await supabase.from('item_centre_stock').upsert({
      item_id: itemId, centre_id: transferCentre,
      current_stock: destQty, reorder_level: reorderLevel, max_level: maxLevel,
    }, { onConflict: 'item_id,centre_id' })

    await supabase.from('audit_logs').insert({
      entity_type: 'stock_transfer', entity_id: `${itemId}`,
      action: 'inter_centre_transfer',
      details: { item_code: itemCode, from_centre: centreId, to_centre: transferCentre, qty: q, reason: reason || null },
    })

    const destName = centres.find(c => c.id === transferCentre)?.code || 'dest'
    toast.success(`Transferred ${q} ${unit} of ${itemCode} from ${centreName} → ${destName}`)
    setLoading(false); setDialog(null); setQty(''); setReason(''); setTransferCentre(''); router.refresh()
  }

  if (!canAdjust) return null

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setAdjustType('add'); setDialog('adjust') }} className="btn-secondary text-sm">
          <Plus size={14} /> Add Stock
        </button>
        <button onClick={() => { setAdjustType('subtract'); setDialog('adjust') }} className="btn-secondary text-sm">
          <Minus size={14} /> Issue / Write-off
        </button>
        {canTransfer && (
          <button onClick={openTransfer} className="btn-secondary text-sm">
            <ArrowRightLeft size={14} /> Transfer
          </button>
        )}
        {currentStock <= reorderLevel && (
          <a href={`/purchase-orders/new?item=${itemId}`} className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium">
            <ShoppingCart size={14} className="inline mr-1" /> Raise PO
          </a>
        )}
      </div>

      {/* Adjust Dialog */}
      {dialog === 'adjust' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setDialog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <button onClick={() => setDialog(null)} disabled={loading} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {adjustType === 'add' ? 'Add Stock' : 'Issue / Write-off'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {itemCode} — {itemName} @ {centreName}
              <span className="block mt-1 font-medium text-gray-700">Current: {currentStock} {unit}</span>
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Quantity ({unit})</label>
                <input type="number" min="1" max={adjustType === 'subtract' ? currentStock : 99999}
                  className="form-input text-lg font-semibold" value={qty}
                  onChange={e => setQty(e.target.value)} autoFocus />
                {qty && <div className="text-xs mt-1 text-gray-500">
                  New stock: <span className="font-semibold">{adjustType === 'add' ? currentStock + parseInt(qty || '0') : currentStock - parseInt(qty || '0')} {unit}</span>
                </div>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Reason (required)</label>
                <select className="form-select text-sm mb-2" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  {adjustType === 'add' ? (
                    <>
                      <option value="Opening balance">Opening balance</option>
                      <option value="Physical count correction">Physical count correction</option>
                      <option value="Return from ward">Return from ward</option>
                      <option value="Found during audit">Found during audit</option>
                    </>
                  ) : (
                    <>
                      <option value="Expired — written off">Expired — written off</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Patient consumption">Patient consumption</option>
                      <option value="Issued to department">Issued to department</option>
                      <option value="Physical count correction">Physical count correction</option>
                      <option value="Theft / pilferage">Theft / pilferage</option>
                    </>
                  )}
                </select>
                {!['', ...['Opening balance', 'Physical count correction', 'Return from ward', 'Found during audit', 'Expired — written off', 'Damaged', 'Patient consumption', 'Issued to department', 'Theft / pilferage']].includes(reason) && (
                  <input className="form-input text-sm" value={reason} onChange={e => setReason(e.target.value)} placeholder="Custom reason..." />
                )}
              </div>
              {adjustType === 'subtract' && parseInt(qty || '0') > currentStock && (
                <div className="p-2 bg-red-50 rounded-lg flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle size={14} /> Cannot issue more than current stock
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDialog(null)} disabled={loading} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleAdjust} disabled={loading || !qty || !reason.trim() || (adjustType === 'subtract' && parseInt(qty) > currentStock)}
                className={`text-sm px-4 py-2 rounded-lg text-white font-medium ${adjustType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : adjustType === 'add' ? `+${qty || 0} ${unit}` : `-${qty || 0} ${unit}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Dialog */}
      {dialog === 'transfer' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !loading && setDialog(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <button onClick={() => setDialog(null)} disabled={loading} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600"><X size={18} /></button>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Inter-Centre Transfer</h3>
            <p className="text-sm text-gray-500 mb-4">{itemCode} — {itemName} | Available: {currentStock} {unit}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">From</label>
                <input className="form-input text-sm bg-gray-50" value={centreName} disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">To Centre</label>
                <select className="form-select text-sm" value={transferCentre} onChange={e => setTransferCentre(e.target.value)}>
                  <option value="">Select destination...</option>
                  {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Quantity ({unit})</label>
                <input type="number" min="1" max={currentStock} className="form-input text-lg font-semibold"
                  value={qty} onChange={e => setQty(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Reason (optional)</label>
                <input className="form-input text-sm" value={reason} onChange={e => setReason(e.target.value)} placeholder="Stock rebalancing, emergency..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDialog(null)} disabled={loading} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleTransfer} disabled={loading || !qty || !transferCentre || parseInt(qty) > currentStock}
                className="text-sm px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 font-medium disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : `Transfer ${qty || 0} ${unit}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
