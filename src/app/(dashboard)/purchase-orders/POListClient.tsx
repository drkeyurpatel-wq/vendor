'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, formatLakhs, formatDate, PO_STATUS_COLORS } from '@/lib/utils'
import {
  ShoppingCart, Plus, Clock, AlertTriangle, CheckCircle2, XCircle, Send,
  Copy, Edit, Printer, Trash2, Eye,
} from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface PO {
  id: string
  po_number: string
  po_date: string
  expected_delivery_date?: string
  total_amount: number
  status: string
  priority?: string
  vendor?: { legal_name: string } | null
  centre?: { code: string; name: string } | null
}

function getPORowActions(po: PO, userRole: string, onDuplicate: (id: string) => Promise<void>): RowAction[] {
  const canApprove = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  const canCancel = ['group_admin', 'group_cao'].includes(userRole)
  const isEditable = ['draft', 'pending_approval'].includes(po.status)
  const isCancellable = !['cancelled', 'closed', 'fully_received'].includes(po.status)

  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/purchase-orders/${po.id}` },
    { key: 'edit', label: 'Edit PO', icon: <Edit size={14} />, href: `/purchase-orders/${po.id}/edit`, visible: isEditable },
    {
      key: 'approve', label: 'Approve', icon: <CheckCircle2 size={14} />, variant: 'primary',
      confirm: true, confirmTitle: `Approve PO ${po.po_number}`,
      confirmDescription: `Approve ${po.po_number} for ${formatLakhs(po.total_amount)} from ${po.vendor?.legal_name || 'vendor'}.`,
      statusField: 'status', newStatus: 'approved',
      visible: po.status === 'pending_approval' && canApprove, divider: true,
    },
    {
      key: 'send', label: 'Mark sent to vendor', icon: <Send size={14} />, variant: 'primary',
      statusField: 'status', newStatus: 'sent_to_vendor',
      extraUpdates: { sent_to_vendor_at: new Date().toISOString() },
      visible: po.status === 'approved',
    },
    {
      key: 'pdf', label: 'Download PDF', icon: <Printer size={14} />, divider: true,
      onExecute: async (id) => {
        try {
          const res = await fetch(`/api/pdf/po?id=${id}`)
          if (!res.ok) throw new Error('PDF generation failed')
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${po.po_number}.pdf`; a.click()
          URL.revokeObjectURL(url)
        } catch (err: any) { toast.error(err.message || 'Failed to generate PDF') }
        return false
      },
    },
    {
      key: 'duplicate', label: 'Duplicate PO', icon: <Copy size={14} />,
      onExecute: async (id) => { await onDuplicate(id) },
    },
    {
      key: 'cancel', label: 'Cancel PO', icon: <XCircle size={14} />, variant: 'danger',
      confirm: true, requireComment: true,
      confirmTitle: `Cancel PO ${po.po_number}`,
      confirmDescription: `This will cancel PO ${po.po_number} (${formatLakhs(po.total_amount)}). Please provide a reason.`,
      statusField: 'status', newStatus: 'cancelled',
      visible: isCancellable && canCancel, divider: true,
    },
    {
      key: 'delete', label: 'Delete draft', icon: <Trash2 size={14} />, variant: 'danger',
      confirm: true, confirmTitle: `Delete ${po.po_number}`,
      confirmDescription: 'This will soft-delete this draft PO. It can be restored by an admin.',
      statusField: 'deleted_at', newStatus: new Date().toISOString(),
      visible: po.status === 'draft',
    },
  ]
}

export default function POListClient({ pos, userRole }: { pos: PO[]; userRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulkAction = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll() {
    if (selectedIds.length === pos.length) setSelectedIds([])
    else setSelectedIds(pos.map(p => p.id))
  }

  async function handleDuplicate(poId: string) {
    const loadingToast = toast.loading('Duplicating PO...')
    try {
      const { data: original, error: poErr } = await supabase
        .from('purchase_orders').select('*, items:purchase_order_items(*)').eq('id', poId).single()
      if (poErr || !original) throw poErr || new Error('PO not found')

      const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
      const centreCode = pos.find(p => p.id === poId)?.centre?.code || 'SHI'
      const now = new Date()
      const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
      const newPoNumber = `H1-${centreCode}-PO-${ym}-${String((count ?? 0) + 1).padStart(3, '0')}`

      const { data: newPO, error: createErr } = await supabase.from('purchase_orders').insert({
        po_number: newPoNumber, vendor_id: original.vendor_id, centre_id: original.centre_id,
        po_date: now.toISOString().split('T')[0], status: 'draft', priority: original.priority,
        delivery_address: original.delivery_address,
        notes: `Duplicated from ${original.po_number}`,
        subtotal: original.subtotal, gst_amount: original.gst_amount, total_amount: original.total_amount,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }).select('id').single()
      if (createErr || !newPO) throw createErr || new Error('Failed to create PO')

      if (original.items?.length > 0) {
        const newItems = original.items.map((item: any) => ({
          po_id: newPO.id, item_id: item.item_id, quantity: item.quantity,
          unit_rate: item.unit_rate, discount_pct: item.discount_pct, gst_pct: item.gst_pct,
          net_rate: item.net_rate, line_total: item.line_total, specifications: item.specifications,
        }))
        await supabase.from('purchase_order_items').insert(newItems)
      }

      toast.dismiss(loadingToast)
      toast.success(`Duplicated as ${newPoNumber}`)
      router.push(`/purchase-orders/${newPO.id}/edit`)
    } catch (err: any) {
      toast.dismiss(loadingToast)
      toast.error(err?.message || 'Duplicate failed')
    }
  }

  const columns = useMemo<ColumnDef<PO, any>[]>(() => {
    const cols: ColumnDef<PO, any>[] = []
    if (canBulkAction) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === pos.length && pos.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />,
      })
    }
    cols.push(
      {
        accessorKey: 'po_number', header: 'PO Number', size: 170,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-gray-900">{row.original.po_number}</span>
            {row.original.priority === 'urgent' && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="Urgent" />}
            {row.original.priority === 'emergency' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-dot" title="Emergency" />}
          </div>
        ),
      },
      { id: 'centre', header: 'Centre', accessorFn: row => row.centre?.code ?? '', size: 80, cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
      { id: 'vendor', header: 'Vendor', accessorFn: row => row.vendor?.legal_name ?? '', cell: ({ row }) => <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] block">{row.original.vendor?.legal_name}</span> },
      { accessorKey: 'po_date', header: 'Date', size: 100, cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.po_date)}</span> },
      {
        accessorKey: 'expected_delivery_date', header: 'Exp. Delivery', size: 110,
        cell: ({ row }) => {
          if (!row.original.expected_delivery_date) return <span className="text-xs text-gray-500">—</span>
          const isLate = new Date(row.original.expected_delivery_date) < new Date() && !['fully_received', 'cancelled', 'closed'].includes(row.original.status)
          return (
            <span className={cn('text-sm', isLate ? 'text-red-600 font-medium' : 'text-gray-600')}>
              {formatDate(row.original.expected_delivery_date)}{isLate && <AlertTriangle size={11} className="inline ml-1 -mt-0.5" />}
            </span>
          )
        },
      },
      { accessorKey: 'total_amount', header: 'Amount', size: 110, cell: ({ row }) => <span className="text-sm font-semibold text-gray-900">{formatLakhs(row.original.total_amount)}</span> },
      {
        accessorKey: 'status', header: 'Status', size: 130,
        cell: ({ row }) => (
          <span className={cn('badge', PO_STATUS_COLORS[row.original.status as keyof typeof PO_STATUS_COLORS])}>
            {row.original.status === 'pending_approval' && <Clock size={10} className="mr-0.5 animate-pulse-dot" />}
            {row.original.status.replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => (
          <RowActions entityId={row.original.id} tableName="purchase_orders" entityType="purchase_order" entityLabel="PO"
            actions={getPORowActions(row.original, userRole, handleDuplicate)} notification={{ action: 'po_status_change' }} />
        ),
      },
    )
    return cols
  }, [selectedIds, pos.length, canBulkAction, userRole])

  const statusCounts = pos.reduce((acc, po) => { acc[po.status] = (acc[po.status] || 0) + 1; return acc }, {} as Record<string, number>)
  const totalValue = pos.reduce((s, p) => s + (p.total_amount || 0), 0)

  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'send', label: 'Mark Sent', icon: <Send size={12} />, variant: 'primary' as const, newStatus: 'sent_to_vendor' },
    { key: 'cancel', label: 'Cancel', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'cancelled' },
  ]

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center">
          <div className="text-xs text-gray-500">Total</div><div className="text-lg font-bold text-navy-600">{pos.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center">
          <div className="text-xs text-gray-500">Value</div><div className="text-sm font-bold text-navy-600">{formatLakhs(totalValue)}</div>
        </div>
        {statusCounts.pending_approval ? <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center"><div className="text-xs text-yellow-600">Pending</div><div className="text-lg font-bold text-yellow-700">{statusCounts.pending_approval}</div></div> : null}
        {statusCounts.approved ? <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center"><div className="text-xs text-blue-600">Approved</div><div className="text-lg font-bold text-blue-700">{statusCounts.approved}</div></div> : null}
        {statusCounts.sent_to_vendor ? <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 text-center"><div className="text-xs text-purple-600">Sent</div><div className="text-lg font-bold text-purple-700">{statusCounts.sent_to_vendor}</div></div> : null}
        {statusCounts.fully_received ? <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center"><div className="text-xs text-green-600">Received</div><div className="text-lg font-bold text-green-700">{statusCounts.fully_received}</div></div> : null}
      </div>
      {canBulkAction && <BulkActionBar selectedIds={selectedIds} entityType="purchase_order" tableName="purchase_orders" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="PO" />}
      <DataTable columns={columns} data={pos} searchPlaceholder="Search PO number, vendor..." showSearch showExport showColumnToggle exportFilename="purchase-orders" pageSize={25}
        onRowClick={(po) => router.push(`/purchase-orders/${po.id}`)}
        emptyIcon={<ShoppingCart size={40} className="text-gray-500" />} emptyTitle="No purchase orders found" emptyDescription="Create your first purchase order to get started"
        emptyAction={<Link href="/purchase-orders/new" className="btn-primary text-sm"><Plus size={15} /> Create First PO</Link>} />
    </>
  )
}
