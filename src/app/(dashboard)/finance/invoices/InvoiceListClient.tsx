'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate, formatLakhs, MATCH_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { FileText, Plus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_ref: string
  vendor_invoice_no: string
  vendor_invoice_date: string
  due_date: string
  total_amount: number
  paid_amount?: number
  match_status: string
  payment_status: string
  vendor?: { legal_name: string } | null
  centre?: { code: string; name: string } | null
}

function isOverdue(dueDate: string, paymentStatus: string): boolean {
  return paymentStatus !== 'paid' && new Date(dueDate) < new Date()
}

export default function InvoiceListClient({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<Invoice, any>[]>(() => [
    {
      accessorKey: 'invoice_ref',
      header: 'Ref',
      size: 160,
      cell: ({ row }) => (
        <Link href={`/finance/invoices/${row.original.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline" onClick={e => e.stopPropagation()}>
          {row.original.invoice_ref}
        </Link>
      ),
    },
    {
      accessorKey: 'vendor_invoice_no',
      header: 'Vendor Inv #',
      size: 130,
      cell: ({ row }) => <span className="font-mono text-xs text-gray-600">{row.original.vendor_invoice_no}</span>,
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
      accessorKey: 'vendor_invoice_date',
      header: 'Inv Date',
      size: 100,
      cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.vendor_invoice_date)}</span>,
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      size: 100,
      cell: ({ row }) => {
        const overdue = isOverdue(row.original.due_date, row.original.payment_status)
        return (
          <span className={cn('text-sm', overdue ? 'text-red-600 font-semibold' : 'text-gray-600')}>
            {formatDate(row.original.due_date)}
            {overdue && <AlertTriangle size={11} className="inline ml-1 -mt-0.5" />}
          </span>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      size: 100,
      cell: ({ row }) => <span className="text-sm font-semibold text-gray-900">{formatLakhs(row.original.total_amount)}</span>,
    },
    {
      accessorKey: 'match_status',
      header: 'Match',
      size: 100,
      cell: ({ row }) => (
        <span className={cn('badge', MATCH_STATUS_COLORS[row.original.match_status as keyof typeof MATCH_STATUS_COLORS])}>
          {row.original.match_status?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      size: 100,
      cell: ({ row }) => (
        <span className={cn('badge', PAYMENT_STATUS_COLORS[row.original.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
          {row.original.payment_status?.replace(/_/g, ' ')}
        </span>
      ),
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={invoices}
      searchPlaceholder="Search invoice ref, vendor invoice no, vendor..."
      showSearch
      showExport
      showColumnToggle
      exportFilename="invoices"
      pageSize={25}
      onRowClick={(inv) => router.push(`/finance/invoices/${inv.id}`)}
      emptyIcon={<FileText size={40} className="text-gray-300" />}
      emptyTitle="No invoices found"
      emptyDescription="Invoices appear when vendors submit invoices against GRNs"
      emptyAction={<Link href="/finance/invoices/new" className="btn-primary text-sm"><Plus size={15} /> New Invoice</Link>}
    />
  )
}
