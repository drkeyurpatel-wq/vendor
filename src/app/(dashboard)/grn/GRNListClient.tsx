'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'

const GRN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  discrepancy: 'bg-red-100 text-red-800',
}

interface GRN {
  id: string
  grn_number: string
  grn_date: string
  vendor_invoice_no?: string
  vendor_invoice_amount?: number
  status: string
  po_id: string
  vendor?: { legal_name: string } | null
  centre?: { code: string; name: string } | null
  po?: { po_number: string } | null
}

export default function GRNListClient({ grns }: { grns: GRN[] }) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<GRN, any>[]>(() => [
    {
      accessorKey: 'grn_number',
      header: 'GRN #',
      size: 160,
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.grn_number}</span>,
    },
    {
      id: 'po_number',
      header: 'PO #',
      accessorFn: row => row.po?.po_number ?? '',
      size: 160,
      cell: ({ row }) => (
        <Link href={`/purchase-orders/${row.original.po_id}`} className="font-mono text-xs text-teal-600 hover:underline" onClick={e => e.stopPropagation()}>
          {row.original.po?.po_number}
        </Link>
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
      accessorKey: 'grn_date',
      header: 'Date',
      size: 100,
      cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.grn_date)}</span>,
    },
    {
      accessorKey: 'vendor_invoice_no',
      header: 'Invoice No.',
      size: 120,
      cell: ({ row }) => <span className="font-mono text-xs text-gray-600">{row.original.vendor_invoice_no || '—'}</span>,
    },
    {
      accessorKey: 'vendor_invoice_amount',
      header: 'Inv. Amt',
      size: 100,
      cell: ({ row }) => <span className="text-sm font-semibold">{row.original.vendor_invoice_amount ? formatLakhs(row.original.vendor_invoice_amount) : '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ row }) => <span className={cn('badge', GRN_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>{row.original.status}</span>,
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={grns}
      searchPlaceholder="Search GRN number, PO, vendor..."
      showSearch
      showExport
      exportFilename="grns"
      pageSize={25}
      onRowClick={(grn) => router.push(`/grn/${grn.id}`)}
      emptyIcon={<ClipboardList size={40} className="text-gray-300" />}
      emptyTitle="No GRNs found"
      emptyDescription="GRNs will appear when you receive goods against purchase orders"
      emptyAction={<Link href="/grn/new" className="btn-primary text-sm"><Plus size={15} /> Create First GRN</Link>}
    />
  )
}
