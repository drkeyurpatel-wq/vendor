'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatLakhs, formatDate, PO_STATUS_COLORS } from '@/lib/utils'
import { ShoppingCart, Plus, Clock, AlertTriangle, CheckCircle2, XCircle, Send } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'

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

export default function POListClient({ pos, userRole }: { pos: PO[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulkAction = ['group_admin', 'group_cao', 'unit_cao'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleAll() {
    if (selectedIds.length === pos.length) setSelectedIds([])
    else setSelectedIds(pos.map(p => p.id))
  }

  const columns = useMemo<ColumnDef<PO, any>[]>(() => {
    const cols: ColumnDef<PO, any>[] = []

    if (canBulkAction) {
      cols.push({
        id: 'select',
        size: 40,
        enableSorting: false,
        header: () => (
          <input type="checkbox" checked={selectedIds.length === pos.length && pos.length > 0}
            onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
        ),
        cell: ({ row }) => (
          <input type="checkbox" checked={selectedIds.includes(row.original.id)}
            onChange={() => toggleSelect(row.original.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
        ),
      })
    }

    cols.push(
      {
        accessorKey: 'po_number',
        header: 'PO Number',
        size: 170,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-gray-900">{row.original.po_number}</span>
            {row.original.priority === 'urgent' && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="Urgent" />}
            {row.original.priority === 'emergency' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-dot" title="Emergency" />}
          </div>
        ),
      },
      {
        id: 'centre',
        header: 'Centre',
        accessorFn: row => row.centre?.code ?? '',
        size: 80,
        cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span>,
      },
      {
        id: 'vendor',
        header: 'Vendor',
        accessorFn: row => row.vendor?.legal_name ?? '',
        cell: ({ row }) => <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] block">{row.original.vendor?.legal_name}</span>,
      },
      {
        accessorKey: 'po_date',
        header: 'Date',
        size: 100,
        cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.po_date)}</span>,
      },
      {
        accessorKey: 'expected_delivery_date',
        header: 'Exp. Delivery',
        size: 110,
        cell: ({ row }) => {
          if (!row.original.expected_delivery_date) return <span className="text-xs text-gray-400">—</span>
          const isLate = new Date(row.original.expected_delivery_date) < new Date() && !['fully_received', 'cancelled', 'closed'].includes(row.original.status)
          return (
            <span className={cn('text-sm', isLate ? 'text-red-600 font-medium' : 'text-gray-600')}>
              {formatDate(row.original.expected_delivery_date)}
              {isLate && <AlertTriangle size={11} className="inline ml-1 -mt-0.5" />}
            </span>
          )
        },
      },
      {
        accessorKey: 'total_amount',
        header: 'Amount',
        size: 110,
        cell: ({ row }) => <span className="text-sm font-semibold text-gray-900">{formatLakhs(row.original.total_amount)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        cell: ({ row }) => (
          <span className={cn('badge', PO_STATUS_COLORS[row.original.status as keyof typeof PO_STATUS_COLORS])}>
            {row.original.status === 'pending_approval' && <Clock size={10} className="mr-0.5 animate-pulse-dot" />}
            {row.original.status.replace(/_/g, ' ')}
          </span>
        ),
      },
    )
    return cols
  }, [selectedIds, pos.length, canBulkAction])

  // Status summary strip
  const statusCounts = pos.reduce((acc, po) => {
    acc[po.status] = (acc[po.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const totalValue = pos.reduce((s, p) => s + (p.total_amount || 0), 0)

  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'send', label: 'Mark Sent', icon: <Send size={12} />, variant: 'primary' as const, newStatus: 'sent_to_vendor' },
    { key: 'cancel', label: 'Cancel', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'cancelled' },
  ]

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-navy-600">{pos.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center">
          <div className="text-xs text-gray-500">Value</div>
          <div className="text-sm font-bold text-navy-600">{formatLakhs(totalValue)}</div>
        </div>
        {statusCounts.pending_approval ? (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center">
            <div className="text-xs text-yellow-600">Pending</div>
            <div className="text-lg font-bold text-yellow-700">{statusCounts.pending_approval}</div>
          </div>
        ) : null}
        {statusCounts.approved ? (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center">
            <div className="text-xs text-blue-600">Approved</div>
            <div className="text-lg font-bold text-blue-700">{statusCounts.approved}</div>
          </div>
        ) : null}
        {statusCounts.fully_received ? (
          <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center">
            <div className="text-xs text-green-600">Received</div>
            <div className="text-lg font-bold text-green-700">{statusCounts.fully_received}</div>
          </div>
        ) : null}
      </div>

      {/* Bulk actions toolbar */}
      {canBulkAction && (
        <BulkActionBar
          selectedIds={selectedIds}
          entityType="purchase_order"
          tableName="purchase_orders"
          actions={bulkActions}
          onClear={() => setSelectedIds([])}
          entityLabel="PO"
        />
      )}

      <DataTable
        columns={columns}
        data={pos}
        searchPlaceholder="Search PO number, vendor..."
        showSearch showExport showColumnToggle
        exportFilename="purchase-orders"
        pageSize={25}
        onRowClick={(po) => router.push(`/purchase-orders/${po.id}`)}
        emptyIcon={<ShoppingCart size={40} className="text-gray-300" />}
        emptyTitle="No purchase orders found"
        emptyDescription="Create your first purchase order to get started"
        emptyAction={<Link href="/purchase-orders/new" className="btn-primary text-sm"><Plus size={15} /> Create First PO</Link>}
      />
    </>
  )
}
