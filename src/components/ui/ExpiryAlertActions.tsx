'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Trash2, RotateCcw, Loader2, X, AlertTriangle, PackageMinus } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExpiryAlert {
  id: string
  item_id: string
  centre_id: string
  batch_number: string
  quantity: number
  expiry_date: string
  alert_level: string
  item_name?: string
  centre_code?: string
}

type ActionType = 'acknowledge' | 'dispose' | 'return' | null

export default function ExpiryAlertActions({ alert, userRole }: { alert: ExpiryAlert; userRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [disposeQty, setDisposeQty] = useState(String(alert.quantity))

  const canAct = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager', 'store_staff'].includes(userRole)
  if (!canAct) return null

  async function handleExecute() {
    if (!activeAction) return
    setLoading(true)

    try {
      if (activeAction === 'acknowledge') {
        // Mark as acknowledged — update GRN item or stock ledger
        await supabase.from('stock_ledger').insert({
          item_id: alert.item_id, centre_id: alert.centre_id,
          movement_type: 'expiry_acknowledged', quantity: 0,
          balance_after: alert.quantity,
          reference_type: 'expiry_alert', reference_id: alert.id,
          batch_number: alert.batch_number,
          notes: note || `Expiry acknowledged for batch ${alert.batch_number}`,
        })
        toast.success('Expiry acknowledged')
      } else if (activeAction === 'dispose') {
        const qty = parseFloat(disposeQty) || 0
        if (qty <= 0 || qty > alert.quantity) { toast.error('Invalid quantity'); setLoading(false); return }

        // Deduct from stock
        const { data: stockRow } = await supabase
          .from('item_centre_stock')
          .select('id, current_stock')
          .eq('item_id', alert.item_id)
          .eq('centre_id', alert.centre_id)
          .single()

        if (stockRow) {
          const newStock = Math.max(0, stockRow.current_stock - qty)
          await supabase.from('item_centre_stock')
            .update({ current_stock: newStock, updated_at: new Date().toISOString() })
            .eq('id', stockRow.id)
        }

        await supabase.from('stock_ledger').insert({
          item_id: alert.item_id, centre_id: alert.centre_id,
          movement_type: 'expired_disposal', quantity: qty,
          balance_after: stockRow ? Math.max(0, stockRow.current_stock - qty) : 0,
          reference_type: 'expiry_alert', reference_id: alert.id,
          batch_number: alert.batch_number,
          notes: note || `Disposed ${qty} expired units from batch ${alert.batch_number}`,
        })
        toast.success(`${qty} units disposed`)
      } else if (activeAction === 'return') {
        // Log return-to-vendor intent
        await supabase.from('stock_ledger').insert({
          item_id: alert.item_id, centre_id: alert.centre_id,
          movement_type: 'return_to_vendor', quantity: parseFloat(disposeQty) || alert.quantity,
          balance_after: 0,
          reference_type: 'expiry_alert', reference_id: alert.id,
          batch_number: alert.batch_number,
          notes: note || `Return-to-vendor initiated for batch ${alert.batch_number}`,
        })
        toast.success('Return-to-vendor logged')
      }

      // Audit
      await supabase.from('activity_log').insert({
        entity_type: 'expiry_alert', entity_id: alert.id,
        action: `expiry_${activeAction}`,
        details: { batch: alert.batch_number, item_id: alert.item_id, quantity: disposeQty, note },
      }).then(() => {}, () => {})

      setActiveAction(null); setNote(''); router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Action failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <button onClick={() => setActiveAction('acknowledge')} title="Acknowledge"
          className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium">
          <CheckCircle2 size={10} className="inline mr-0.5" /> Ack
        </button>
        <button onClick={() => { setActiveAction('dispose'); setDisposeQty(String(alert.quantity)) }} title="Dispose expired"
          className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-medium">
          <Trash2 size={10} className="inline mr-0.5" /> Dispose
        </button>
        <button onClick={() => { setActiveAction('return'); setDisposeQty(String(alert.quantity)) }} title="Return to vendor"
          className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors font-medium">
          <RotateCcw size={10} className="inline mr-0.5" /> Return
        </button>
      </div>

      {activeAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => !loading && setActiveAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in space-y-3">
            <button onClick={() => setActiveAction(null)} disabled={loading} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
            <h3 className="text-sm font-bold text-navy-600 flex items-center gap-2">
              {activeAction === 'acknowledge' && <><CheckCircle2 size={16} className="text-blue-600" /> Acknowledge Expiry</>}
              {activeAction === 'dispose' && <><Trash2 size={16} className="text-red-600" /> Dispose Expired Stock</>}
              {activeAction === 'return' && <><RotateCcw size={16} className="text-orange-600" /> Return to Vendor</>}
            </h3>
            <p className="text-xs text-gray-500">
              Batch <span className="font-mono font-semibold">{alert.batch_number}</span> · {alert.quantity} units
              {alert.item_name && <> · {alert.item_name}</>}
              {alert.centre_code && <> @ {alert.centre_code}</>}
            </p>

            {(activeAction === 'dispose' || activeAction === 'return') && (
              <div>
                <label className="form-label">Quantity</label>
                <input type="number" step="1" min="1" max={alert.quantity} value={disposeQty}
                  onChange={e => setDisposeQty(e.target.value)} className="form-input text-sm" />
              </div>
            )}

            <div>
              <label className="form-label">Notes{activeAction !== 'acknowledge' && <span className="text-gray-400 text-xs ml-1">(optional)</span>}</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="form-input text-sm"
                placeholder={activeAction === 'dispose' ? 'Disposal reason...' : activeAction === 'return' ? 'Return details...' : 'Notes...'} />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setActiveAction(null)} disabled={loading} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleExecute} disabled={loading}
                className={`text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-colors ${
                  activeAction === 'dispose' ? 'bg-red-600 hover:bg-red-700' :
                  activeAction === 'return' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}>
                {loading ? <Loader2 size={12} className="animate-spin" /> : activeAction === 'acknowledge' ? 'Acknowledge' : activeAction === 'dispose' ? 'Dispose' : 'Log Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
