'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { Wallet, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'

const BATCH_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

interface Batch {
  id: string
  batch_number: string
  batch_date: string
  status: string
  total_amount: number
  notes?: string
  centre_id?: string
}

export default function PaymentListClient({ batches }: { batches: Batch[] }) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<Batch, any>[]>(() => [
    {
      accessorKey: 'batch_number',
      header: 'Batch #',
      size: 160,
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.batch_number}</span>,
    },
    {
      accessorKey: 'batch_date',
      header: 'Date',
      size: 110,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-gray-400" />
          <span className="text-sm text-gray-700">{formatDate(row.original.batch_date)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      size: 120,
      cell: ({ row }) => <span className="text-sm font-bold text-gray-900">{formatLakhs(row.original.total_amount)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => (
        <span className={cn('badge', BATCH_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>
          {row.original.status?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => <span className="text-xs text-gray-500 truncate max-w-[200px] block">{row.original.notes || '—'}</span>,
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={batches}
      searchPlaceholder="Search batch number..."
      showSearch
      showExport
      exportFilename="payment-batches"
      pageSize={25}
      onRowClick={(batch) => router.push(`/finance/payments/${batch.id}`)}
      emptyIcon={<Wallet size={40} className="text-gray-300" />}
      emptyTitle="No payment batches"
      emptyDescription="Payment batches group approved invoices for Saturday payment cycle"
      emptyAction={<Link href="/finance/payments/new" className="btn-primary text-sm"><Plus size={15} /> New Batch</Link>}
    />
  )
}
