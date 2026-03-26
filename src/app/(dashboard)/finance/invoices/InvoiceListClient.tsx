'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatLakhs, formatDate, formatCurrency, MATCH_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { FileText, AlertTriangle, CheckCircle2, CreditCard, Scale, XCircle } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'

interface Invoice {
  id: string
  invoice_ref: string
  vendor_invoice_no?: string
  vendor_invoice_date?: string
  total_amount: number
  paid_amount?: number
  due_date?: string
  status?: string
  match_status?: string
  payment_status?: string
  vendor?: { legal_name: string; vendor_code: string } | null
  centre?: { code: string } | null
}

export default function InvoiceListClient({ invoices, userRole }: { invoices: Invoice[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = useMemo<ColumnDef<Invoice, any>[]>(() => {
    const cols: ColumnDef<Invoice, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === invoices.length && invoices.length > 0}
          onChange={() => setSelectedIds(selectedIds.length === invoices.length ? [] : invoices.map(i => i.id))}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      {
        accessorKey: 'invoice_ref', header: 'Ref', size: 150,
        cell: ({ row }) => <Link href={`/finance/invoices/${row.original.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{row.original.invoice_ref}</Link>,
      },
      {
        id: 'vendor', header: 'Vendor', accessorFn: r => r.vendor?.legal_name ?? '',
        cell: ({ row }) => (
          <div>
            <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{row.original.vendor?.legal_name}</div>
            <div className="font-mono text-[10px] text-gray-500">{row.original.vendor?.vendor_code}</div>
          </div>
        ),
      },
      {
        id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 70,
        cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span>,
      },
      {
        accessorKey: 'vendor_invoice_no', header: 'Vendor Inv #', size: 120,
        cell: ({ row }) => <span className="font-mono text-xs text-gray-600">{row.original.vendor_invoice_no || '—'}</span>,
      },
      {
        accessorKey: 'total_amount', header: 'Amount', size: 100,
        cell: ({ row }) => <span className="text-sm font-semibold">{formatLakhs(row.original.total_amount)}</span>,
      },
      {
        id: 'outstanding', header: 'Outstanding', size: 100,
        accessorFn: r => (r.total_amount || 0) - (r.paid_amount || 0),
        cell: ({ row }) => {
          const out = (row.original.total_amount || 0) - (row.original.paid_amount || 0)
          return out > 0 ? <span className="text-sm font-semibold text-red-600">{formatCurrency(out)}</span> : <span className="text-xs text-green-600">Paid</span>
        },
      },
      {
        accessorKey: 'due_date', header: 'Due Date', size: 100,
        cell: ({ row }) => {
          if (!row.original.due_date) return <span className="text-xs text-gray-500">—</span>
          const overdue = row.original.payment_status !== 'paid' && new Date(row.original.due_date) < new Date()
          return (
            <span className={cn('text-sm', overdue ? 'text-red-600 font-medium' : 'text-gray-600')}>
              {formatDate(row.original.due_date)}{overdue && <AlertTriangle size={10} className="inline ml-1" />}
            </span>
          )
        },
      },
      {
        accessorKey: 'match_status', header: 'Match', size: 90,
        cell: ({ row }) => <span className={cn('badge', MATCH_STATUS_COLORS[(row.original.match_status || 'pending') as keyof typeof MATCH_STATUS_COLORS])}>{(row.original.match_status || 'pending').replace(/_/g, ' ')}</span>,
      },
      {
        accessorKey: 'payment_status', header: 'Payment', size: 90,
        cell: ({ row }) => <span className={cn('badge', PAYMENT_STATUS_COLORS[(row.original.payment_status || 'unpaid') as keyof typeof PAYMENT_STATUS_COLORS])}>{(row.original.payment_status || 'unpaid').replace(/_/g, ' ')}</span>,
      },
    )
    return cols
  }, [selectedIds, invoices.length, canBulk])

  const totalOutstanding = invoices.reduce((s, i) => s + (i.total_amount || 0) - (i.paid_amount || 0), 0)
  const overdueCount = invoices.filter(i => i.payment_status !== 'paid' && i.due_date && new Date(i.due_date) < new Date()).length

  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'dispute', label: 'Dispute', icon: <Scale size={12} />, variant: 'warning' as const, requireComment: true, newStatus: 'disputed' },
    { key: 'reject', label: 'Reject', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'rejected' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3">
          <div className="text-xs text-gray-500">Total Invoices</div>
          <div className="text-lg font-bold text-navy-600">{invoices.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-3">
          <div className="text-xs text-gray-500">Total Value</div>
          <div className="text-sm font-bold text-navy-600">{formatLakhs(invoices.reduce((s, i) => s + (i.total_amount || 0), 0))}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-3">
          <div className="text-xs text-red-600">Outstanding</div>
          <div className="text-lg font-bold text-red-600">{formatLakhs(totalOutstanding)}</div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-3">
          <div className="text-xs text-orange-600">Overdue</div>
          <div className="text-lg font-bold text-orange-600">{overdueCount}</div>
        </div>
      </div>

      {canBulk && (
        <BulkActionBar selectedIds={selectedIds} entityType="invoice" tableName="invoices"
          actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="invoice" />
      )}

      <DataTable columns={columns} data={invoices}
        searchPlaceholder="Search invoice ref, vendor..." showSearch showExport showColumnToggle
        exportFilename="invoices" pageSize={25}
        onRowClick={inv => router.push(`/finance/invoices/${inv.id}`)}
        emptyIcon={<FileText size={40} className="text-gray-500" />}
        emptyTitle="No invoices found" emptyDescription="Invoices are created when GRNs are verified" />
    </>
  )
}
