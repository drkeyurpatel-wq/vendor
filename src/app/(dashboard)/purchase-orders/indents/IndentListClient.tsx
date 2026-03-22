'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate } from '@/lib/utils'
import { ClipboardList, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const INDENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  converted_to_po: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  normal: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
}

interface Indent {
  id: string
  indent_number: string
  status: string
  priority: string
  notes?: string
  created_at: string
  centre?: { code: string; name: string } | null
  created_by_user?: { full_name: string } | null
}

export default function IndentListClient({ indents }: { indents: Indent[] }) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<Indent, any>[]>(() => [
    {
      accessorKey: 'indent_number',
      header: 'Indent #',
      size: 180,
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.indent_number}</span>,
    },
    {
      id: 'centre',
      header: 'Centre',
      accessorFn: row => row.centre?.code ?? '',
      size: 80,
      cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span>,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 90,
      cell: ({ row }) => (
        <span className={cn('badge', PRIORITY_COLORS[row.original.priority] || 'bg-gray-100 text-gray-700')}>
          {row.original.priority}
        </span>
      ),
    },
    {
      id: 'requested_by',
      header: 'Requested By',
      accessorFn: row => row.created_by_user?.full_name ?? '',
      cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.created_by_user?.full_name || '—'}</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      size: 100,
      cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.created_at)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => (
        <span className={cn('badge', INDENT_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>
          {row.original.status?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.status === 'approved') {
          return (
            <Link
              href={`/purchase-orders/new?indent=${row.original.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Convert to PO <ArrowRight size={12} />
            </Link>
          )
        }
        return null
      },
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={indents}
      searchPlaceholder="Search indent number, centre..."
      showSearch
      showExport
      exportFilename="indents"
      pageSize={25}
      emptyIcon={<ClipboardList size={40} className="text-gray-300" />}
      emptyTitle="No purchase indents found"
      emptyDescription="Indents are internal procurement requests from store staff"
      emptyAction={<Link href="/purchase-orders/indents/new" className="btn-primary text-sm"><Plus size={15} /> New Indent</Link>}
    />
  )
}
