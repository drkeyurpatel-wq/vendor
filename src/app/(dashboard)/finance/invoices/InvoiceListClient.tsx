'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, formatLakhs, formatDate, MATCH_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { FileText, Eye, CheckCircle2, AlertTriangle, CreditCard, XCircle, FileWarning, Clock } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'
import toast from 'react-hot-toast'

interface Invoice {
  id: string
  invoice_ref?: string
  vendor_invoice_no: string
  vendor_invoice_date: string
  due_date?: string
  total_amount: number
  match_status: string
  payment_status: string
  vendor?: { legal_name: string; vendor_code: string } | null
  centre?: { code: string } | null
  grn?: { grn_number: string } | null
}

function getInvoiceRowActions(inv: Invoice, userRole: string): RowAction[] {
  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)
  const isOverdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.payment_status !== 'paid'
  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/finance/invoices/${inv.id}` },
    {
      key: 'run_match', label: 'Run 3-way match', icon: <CheckCircle2 size={14} />, variant: 'primary',
      onExecute: async (id) => {
        try {
          const res = await fetch('/api/invoices/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: id }) })
          if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Match failed') }
          const data = await res.json()
          toast.success(`Match result: ${data.match_status?.replace(/_/g, ' ')}`)
          return true
        } catch (err: any) { toast.error(err.message); return false }
      },
      visible: inv.match_status === 'pending' && canManage, divider: true,
    },
    {
      key: 'mark_paid', label: 'Mark as paid', icon: <CreditCard size={14} />, variant: 'primary',
      confirm: true, confirmTitle: `Mark ${inv.vendor_invoice_no} as paid`,
      confirmDescription: `Confirm payment of ${formatLakhs(inv.total_amount)} to ${inv.vendor?.legal_name || 'vendor'}.`,
      statusField: 'payment_status', newStatus: 'paid',
      extraUpdates: { paid_at: new Date().toISOString() },
      visible: inv.payment_status !== 'paid' && inv.match_status === 'matched' && canManage,
    },
    {
      key: 'dispute', label: 'Dispute invoice', icon: <AlertTriangle size={14} />, variant: 'warning',
      confirm: true, requireComment: true,
      confirmTitle: `Dispute ${inv.vendor_invoice_no}`,
      confirmDescription: 'Describe the dispute reason. Vendor will be notified.',
      statusField: 'payment_status', newStatus: 'disputed',
      visible: inv.payment_status !== 'paid' && canManage,
    },
    {
      key: 'hold', label: 'Put on hold', icon: <Clock size={14} />,
      statusField: 'payment_status', newStatus: 'on_hold',
      visible: inv.payment_status === 'unpaid' && canManage,
    },
    {
      key: 'debit_note', label: 'Create debit note', icon: <FileWarning size={14} />,
      href: `/finance/debit-notes/new?invoice_id=${inv.id}`,
      visible: inv.match_status === 'mismatch' && canManage, divider: true,
    },
  ]
}

export default function InvoiceListClient({ invoices, userRole }: { invoices: Invoice[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(userRole)

  function toggleSelect(id: string) { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const columns = useMemo<ColumnDef<Invoice, any>[]>(() => {
    const cols: ColumnDef<Invoice, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === invoices.length && invoices.length > 0} onChange={() => setSelectedIds(selectedIds.length === invoices.length ? [] : invoices.map(i => i.id))} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'vendor_invoice_no', header: 'Invoice #', size: 140, cell: ({ row }) => <Link href={`/finance/invoices/${row.original.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{row.original.vendor_invoice_no}</Link> },
      { id: 'vendor', header: 'Vendor', accessorFn: r => r.vendor?.legal_name ?? '', cell: ({ row }) => <span className="text-sm font-medium text-gray-900 truncate max-w-[180px] block">{row.original.vendor?.legal_name}</span> },
      { id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 70, cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
      { accessorKey: 'vendor_invoice_date', header: 'Date', size: 100, cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.vendor_invoice_date)}</span> },
      {
        accessorKey: 'due_date', header: 'Due', size: 100,
        cell: ({ row }) => {
          if (!row.original.due_date) return <span className="text-xs text-gray-400">—</span>
          const overdue = new Date(row.original.due_date) < new Date() && row.original.payment_status !== 'paid'
          return <span className={cn('text-sm', overdue ? 'text-red-600 font-medium' : 'text-gray-600')}>{formatDate(row.original.due_date)}{overdue && <AlertTriangle size={11} className="inline ml-1 -mt-0.5" />}</span>
        },
      },
      { accessorKey: 'total_amount', header: 'Amount', size: 100, cell: ({ row }) => <span className="text-sm font-semibold text-gray-900">{formatLakhs(row.original.total_amount)}</span> },
      { accessorKey: 'match_status', header: 'Match', size: 90, cell: ({ row }) => <span className={cn('badge', MATCH_STATUS_COLORS[row.original.match_status as keyof typeof MATCH_STATUS_COLORS] || 'bg-gray-100 text-gray-700')}>{row.original.match_status.replace(/_/g, ' ')}</span> },
      { accessorKey: 'payment_status', header: 'Payment', size: 90, cell: ({ row }) => <span className={cn('badge', PAYMENT_STATUS_COLORS[row.original.payment_status as keyof typeof PAYMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-700')}>{row.original.payment_status}</span> },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => <RowActions entityId={row.original.id} tableName="invoices" entityType="invoice" entityLabel="Invoice" actions={getInvoiceRowActions(row.original, userRole)} notification={{ action: 'invoice_status_change' }} />,
      },
    )
    return cols
  }, [selectedIds, invoices.length, canBulk, userRole])

  const unpaidCount = invoices.filter(i => i.payment_status === 'unpaid').length
  const mismatchCount = invoices.filter(i => i.match_status === 'mismatch').length
  const overdueCount = invoices.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.payment_status !== 'paid').length
  const totalUnpaid = invoices.filter(i => i.payment_status !== 'paid').reduce((s, i) => s + i.total_amount, 0)

  const bulkActions = [
    { key: 'batch_match', label: 'Run Match', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'matched' },
    { key: 'hold', label: 'Hold', icon: <Clock size={12} />, variant: 'warning' as const, newStatus: 'on_hold' },
    { key: 'dispute', label: 'Dispute', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'disputed' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Total</div><div className="text-lg font-bold text-navy-600">{invoices.length}</div></div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Unpaid Total</div><div className="text-sm font-bold text-red-600">{formatLakhs(totalUnpaid)}</div></div>
        {unpaidCount > 0 && <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center"><div className="text-xs text-red-600">Unpaid</div><div className="text-lg font-bold text-red-700">{unpaidCount}</div></div>}
        {overdueCount > 0 && <div className="bg-orange-50 rounded-xl border border-orange-200 p-3 text-center"><div className="text-xs text-orange-600">Overdue</div><div className="text-lg font-bold text-orange-700">{overdueCount}</div></div>}
        {mismatchCount > 0 && <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center"><div className="text-xs text-yellow-600">Mismatch</div><div className="text-lg font-bold text-yellow-700">{mismatchCount}</div></div>}
      </div>
      {canBulk && <BulkActionBar selectedIds={selectedIds} entityType="invoice" tableName="invoices" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="Invoice" />}
      <DataTable columns={columns} data={invoices} searchPlaceholder="Search invoice#, vendor..." showSearch showExport showColumnToggle exportFilename="invoices" pageSize={25}
        onRowClick={i => router.push(`/finance/invoices/${i.id}`)}
        emptyIcon={<FileText size={40} className="text-gray-500" />} emptyTitle="No invoices found" emptyDescription="Invoices are created from verified GRNs" />
    </>
  )
}
