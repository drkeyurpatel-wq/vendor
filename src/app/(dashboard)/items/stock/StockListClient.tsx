'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, formatLakhs } from '@/lib/utils'
import { Package, TrendingDown, Plus, Minus, RefreshCcw, ShoppingCart, AlertTriangle, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface StockItem {
  id: string
  item_id: string
  centre_id: string
  current_stock: number
  reorder_level: number
  max_level: number
  item?: { item_code: string; name: string; unit_of_measurement?: string } | null
  centre?: { code: string; name: string } | null
}

// ─── Stock Adjustment Modal ──────────────────────────────

function StockAdjustModal({ open, item, onClose, onSave }: {
  open: boolean; item: StockItem | null; onClose: () => void
  onSave: (itemId: string, centreId: string, qty: number, reason: string, type: 'add' | 'subtract') => Promise<void>
}) {
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [type, setType] = useState<'add' | 'subtract'>('add')
  const [loading, setLoading] = useState(false)

  if (!open || !item) return null

  async function handleSubmit() {
    if (!item) return
    const numQty = parseFloat(qty)
    if (isNaN(numQty) || numQty <= 0) { toast.error('Enter a valid quantity'); return }
    if (!reason.trim()) { toast.error('Reason is required for stock adjustment'); return }
    setLoading(true)
    try {
      await onSave(item.item_id, item.centre_id, numQty, reason, type)
      setQty(''); setReason(''); onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-navy-600">Adjust Stock: {item.item?.name}</h3>
        <p className="text-sm text-gray-500">Current: {item.current_stock} {item.item?.unit_of_measurement} at {item.centre?.code}</p>

        <div className="flex gap-2">
          <button onClick={() => setType('add')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium border transition-colors', type === 'add' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-200 text-gray-500')}>
            <Plus size={14} className="inline mr-1" /> Add Stock
          </button>
          <button onClick={() => setType('subtract')} className={cn('flex-1 py-2 rounded-lg text-sm font-medium border transition-colors', type === 'subtract' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-200 text-gray-500')}>
            <Minus size={14} className="inline mr-1" /> Remove Stock
          </button>
        </div>

        <div>
          <label className="form-label">Quantity</label>
          <input type="number" step="0.01" min="0" value={qty} onChange={e => setQty(e.target.value)}
            className="form-input" placeholder="Enter quantity" autoFocus />
          {qty && <p className="text-xs text-gray-500 mt-1">New stock: {type === 'add' ? item.current_stock + parseFloat(qty || '0') : item.current_stock - parseFloat(qty || '0')} {item.item?.unit_of_measurement}</p>}
        </div>

        <div>
          <label className="form-label">Reason <span className="text-red-500">*</span></label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
            className="form-input" placeholder="e.g., Physical recount, Damaged goods, Transfer correction" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : `${type === 'add' ? 'Add' : 'Remove'} Stock`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reorder Level Edit Modal ────────────────────────────

function ReorderEditModal({ open, item, onClose, onSave }: {
  open: boolean; item: StockItem | null; onClose: () => void
  onSave: (id: string, reorder: number, max: number) => Promise<void>
}) {
  const [reorder, setReorder] = useState(String(item?.reorder_level || 0))
  const [max, setMax] = useState(String(item?.max_level || 0))
  const [loading, setLoading] = useState(false)

  if (!open || !item) return null

  async function handleSubmit() {
    if (!item) return
    setLoading(true)
    try {
      await onSave(item.id, parseFloat(reorder) || 0, parseFloat(max) || 0)
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-navy-600">Set Levels: {item.item?.name}</h3>
        <div>
          <label className="form-label">Reorder Level</label>
          <input type="number" value={reorder} onChange={e => setReorder(e.target.value)} className="form-input" />
        </div>
        <div>
          <label className="form-label">Max Level</label>
          <input type="number" value={max} onChange={e => setMax(e.target.value)} className="form-input" />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

export default function StockListClient({ stocks, userRole }: { stocks: StockItem[]; userRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null)
  const [reorderItem, setReorderItem] = useState<StockItem | null>(null)

  const handleStockAdjust = useCallback(async (itemId: string, centreId: string, qty: number, reason: string, type: 'add' | 'subtract') => {
    const delta = type === 'add' ? qty : -qty
    const stock = stocks.find(s => s.item_id === itemId && s.centre_id === centreId)
    if (!stock) return

    const newQty = stock.current_stock + delta
    if (newQty < 0) { toast.error('Stock cannot go below zero'); return }

    const { error: updateErr } = await supabase.from('item_centre_stock').update({ current_stock: newQty, updated_at: new Date().toISOString() }).eq('id', stock.id)
    if (updateErr) { toast.error(updateErr.message); return }

    // Log to stock ledger
    await supabase.from('stock_ledger').insert({
      item_id: itemId, centre_id: centreId,
      transaction_type: type === 'add' ? 'adjustment_in' : 'adjustment_out',
      notes: reason,
    }).then(() => {}, () => {})

    toast.success(`Stock ${type === 'add' ? 'added' : 'removed'}: ${qty} → new balance ${newQty}`)
    router.refresh()
  }, [stocks, supabase, router])

  const handleReorderSave = useCallback(async (id: string, reorder: number, max: number) => {
    const { error } = await supabase.from('item_centre_stock').update({ reorder_level: reorder, max_level: max, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Stock levels updated')
    router.refresh()
  }, [supabase, router])

  const columns = useMemo<ColumnDef<StockItem, any>[]>(() => [
    { id: 'item_code', header: 'Code', accessorFn: r => r.item?.item_code ?? '', size: 100, cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.item?.item_code}</span> },
    { id: 'item_name', header: 'Item', accessorFn: r => r.item?.name ?? '', cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{row.original.item?.name}</span> },
    { id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 70, cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
    {
      accessorKey: 'current_stock', header: 'Stock', size: 100,
      cell: ({ row }) => {
        const s = row.original
        const isLow = s.reorder_level > 0 && s.current_stock <= s.reorder_level
        const isZero = s.current_stock === 0
        return (
          <div className="flex items-center gap-1">
            <span className={cn('text-sm font-semibold', isZero ? 'text-red-700' : isLow ? 'text-orange-600' : 'text-gray-900')}>{s.current_stock}</span>
            <span className="text-xs text-gray-400">{s.item?.unit_of_measurement}</span>
            {isLow && <TrendingDown size={12} className="text-orange-500" />}
          </div>
        )
      },
    },
    { accessorKey: 'reorder_level', header: 'Reorder', size: 80, cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.reorder_level || '—'}</span> },
    { accessorKey: 'max_level', header: 'Max', size: 70, cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.max_level || '—'}</span> },
    {
      id: 'fill_pct', header: 'Fill %', size: 80,
      cell: ({ row }) => {
        const s = row.original
        if (!s.max_level) return <span className="text-xs text-gray-400">—</span>
        const pct = Math.round((s.current_stock / s.max_level) * 100)
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', pct < 25 ? 'bg-red-500' : pct < 50 ? 'bg-orange-400' : 'bg-green-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-500">{pct}%</span>
          </div>
        )
      },
    },
    {
      id: 'actions', header: '', size: 50, enableSorting: false,
      cell: ({ row }) => {
        const s = row.original
        const canManage = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager', 'store_staff'].includes(userRole)
        const actions: RowAction[] = [
          {
            key: 'adjust', label: 'Adjust stock', icon: <RefreshCcw size={14} />, variant: 'primary',
            onExecute: async () => { setAdjustItem(s); return false },
            visible: canManage,
          },
          {
            key: 'set_levels', label: 'Set reorder/max levels', icon: <AlertTriangle size={14} />,
            onExecute: async () => { setReorderItem(s); return false },
            visible: canManage,
          },
          {
            key: 'indent', label: 'Raise purchase indent', icon: <ClipboardList size={14} />,
            href: `/purchase-orders/indents/new?item_id=${s.item_id}&centre_id=${s.centre_id}`,
            visible: s.reorder_level > 0 && s.current_stock <= s.reorder_level, divider: true,
          },
        ]
        return <RowActions entityId={s.id} tableName="item_centre_stock" entityType="stock" entityLabel="Stock" actions={actions} />
      },
    },
  ], [userRole])

  const lowStockCount = stocks.filter(s => s.reorder_level > 0 && s.current_stock <= s.reorder_level).length
  const zeroStockCount = stocks.filter(s => s.current_stock === 0).length

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Total SKUs</div><div className="text-lg font-bold text-navy-600">{stocks.length}</div></div>
        {zeroStockCount > 0 && <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center"><div className="text-xs text-red-600">Zero Stock</div><div className="text-lg font-bold text-red-700">{zeroStockCount}</div></div>}
        {lowStockCount > 0 && <div className="bg-orange-50 rounded-xl border border-orange-200 p-3 text-center"><div className="text-xs text-orange-600">Below Reorder</div><div className="text-lg font-bold text-orange-700">{lowStockCount}</div></div>}
        <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center"><div className="text-xs text-green-600">Adequate</div><div className="text-lg font-bold text-green-700">{stocks.length - lowStockCount - zeroStockCount}</div></div>
      </div>

      <DataTable columns={columns} data={stocks} searchPlaceholder="Search item name, code..." showSearch showExport showColumnToggle exportFilename="stock-levels" pageSize={30}
        emptyIcon={<Package size={40} className="text-gray-500" />} emptyTitle="No stock data" emptyDescription="Stock records are created when GRNs are verified" />

      <StockAdjustModal open={!!adjustItem} item={adjustItem} onClose={() => setAdjustItem(null)} onSave={handleStockAdjust} />
      <ReorderEditModal open={!!reorderItem} item={reorderItem} onClose={() => setReorderItem(null)} onSave={handleReorderSave} />
    </>
  )
}
