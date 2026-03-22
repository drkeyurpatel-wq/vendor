'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatLakhs, formatDate, PO_STATUS_COLORS } from '@/lib/utils'
import { ShoppingCart, Plus, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

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

  const columns = useMemo<ColumnDef<PO, any>[]>(() => [
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
      cell: ({ row }) => <span className="text-sm font-medium text-gray-900">{row.original.vendor?.legal_name}</span>,
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
  ], [])

  return (
    <DataTable
      columns={columns}
      data={pos}
      searchPlaceholder="Search PO number, vendor..."
      showSearch
      showExport
      showColumnToggle
      exportFilename="purchase-orders"
      pageSize={25}
      onRowClick={(po) => router.push(`/purchase-orders/${po.id}`)}
      emptyIcon={<ShoppingCart size={40} className="text-gray-300" />}
      emptyTitle="No purchase orders found"
      emptyDescription="Create your first purchase order to get started"
      emptyAction={<Link href="/purchase-orders/new" className="btn-primary text-sm"><Plus size={15} /> Create First PO</Link>}
    />
  )
}
