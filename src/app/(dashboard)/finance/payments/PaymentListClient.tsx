'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, formatLakhs, formatDate } from '@/lib/utils'
import { Wallet, Eye, CheckCircle2, XCircle, Clock, CreditCard, Printer, Download, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'
import { createClient } from '@/lib/supabase/client'
import { fireNotification } from '@/lib/notifications'
import toast from 'react-hot-toast'

const BATCH_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800', processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
}

interface PaymentBatch {
  id: string
  batch_number: string
  batch_date: string
  status: string
  total_amount: number
  item_count?: number
  payment_mode?: string
  created_by_profile?: { full_name: string } | null
  centre?: { code: string } | null
}

function getPaymentRowActions(batch: PaymentBatch, userRole: string): RowAction[] {
  const canApprove = ['group_admin', 'group_cao'].includes(userRole)
  const canProcess = ['group_admin', 'group_cao', 'finance_staff'].includes(userRole)
  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/finance/payments/${batch.id}` },
    {
      key: 'approve', label: 'Approve batch', icon: <CheckCircle2 size={14} />, variant: 'primary',
      confirm: true, confirmTitle: `Approve batch ${batch.batch_number}`,
      confirmDescription: `Approve payment batch of ${formatLakhs(batch.total_amount)} (${batch.item_count || 0} invoices). This authorises fund release.`,
      statusField: 'status', newStatus: 'approved',
      visible: batch.status === 'pending_approval' && canApprove, divider: true,
    },
    {
      key: 'process', label: 'Start processing', icon: <PlayCircle size={14} />, variant: 'primary',
      statusField: 'status', newStatus: 'processing',
      visible: batch.status === 'approved' && canProcess,
    },
    {
      key: 'complete', label: 'Mark completed', icon: <CreditCard size={14} />, variant: 'primary',
      confirm: true, confirmTitle: `Complete batch ${batch.batch_number}`,
      confirmDescription: `Confirm all ${batch.item_count || 0} payments in this batch have been disbursed (${formatLakhs(batch.total_amount)}).`,
      statusField: 'status', newStatus: 'completed',
      
      visible: batch.status === 'processing' && canProcess,
    },
    {
      key: 'reject', label: 'Reject batch', icon: <XCircle size={14} />, variant: 'danger',
      confirm: true, requireComment: true,
      confirmTitle: `Reject batch ${batch.batch_number}`,
      statusField: 'status', newStatus: 'cancelled',
      visible: batch.status === 'pending_approval' && canApprove,
    },
    {
      key: 'pdf', label: 'Download payment advice', icon: <Printer size={14} />, divider: true,
      onExecute: async (id) => {
        try {
          const res = await fetch(`/api/pdf/payment-advice?id=${id}`)
          if (!res.ok) throw new Error('PDF generation failed')
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${batch.batch_number}-advice.pdf`; a.click()
          URL.revokeObjectURL(url)
        } catch (err: any) { toast.error(err.message || 'Failed') }
        return false
      },
    },
  ]
}

export default function PaymentListClient({ batches, userRole }: { batches: PaymentBatch[]; userRole: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao'].includes(userRole)

  function toggleSelect(id: string) { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const columns = useMemo<ColumnDef<PaymentBatch, any>[]>(() => {
    const cols: ColumnDef<PaymentBatch, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === batches.length && batches.length > 0} onChange={() => setSelectedIds(selectedIds.length === batches.length ? [] : batches.map(b => b.id))} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'batch_number', header: 'Batch #', size: 180, cell: ({ row }) => <Link href={`/finance/payments/${row.original.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{row.original.batch_number}</Link> },
      { id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 70, cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
      { accessorKey: 'batch_date', header: 'Date', size: 100, cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.batch_date)}</span> },
      { accessorKey: 'total_amount', header: 'Amount', size: 110, cell: ({ row }) => <span className="text-sm font-semibold text-gray-900">{formatLakhs(row.original.total_amount)}</span> },
      { id: 'items', header: 'Invoices', size: 80, cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.item_count || 0}</span> },
      { accessorKey: 'payment_mode', header: 'Mode', size: 80, cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.payment_mode || 'NEFT'}</span> },
      { id: 'created_by', header: 'Created by', accessorFn: r => r.created_by_profile?.full_name ?? '', size: 120, cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.created_by_profile?.full_name || '—'}</span> },
      { accessorKey: 'status', header: 'Status', size: 120, cell: ({ row }) => <span className={cn('badge', BATCH_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>{row.original.status.replace(/_/g, ' ')}</span> },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => <RowActions entityId={row.original.id} tableName="payment_batches" entityType="payment_batch" entityLabel="Payment batch" actions={getPaymentRowActions(row.original, userRole)} notification={{ action: 'payment_batch_status_change' }} />,
      },
    )
    return cols
  }, [selectedIds, batches.length, canBulk, userRole])

  const statusCounts = batches.reduce((acc, b) => { acc[b.status] = (acc[b.status] || 0) + 1; return acc }, {} as Record<string, number>)
  const totalPending = batches.filter(b => b.status === 'pending_approval').reduce((s, b) => s + b.total_amount, 0)

  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'cancel', label: 'Cancel', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'cancelled' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Total Batches</div><div className="text-lg font-bold text-navy-600">{batches.length}</div></div>
        {statusCounts.pending_approval ? <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center"><div className="text-xs text-yellow-600">Pending</div><div className="text-lg font-bold text-yellow-700">{statusCounts.pending_approval}</div><div className="text-xs text-yellow-600">{formatLakhs(totalPending)}</div></div> : null}
        {statusCounts.approved ? <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center"><div className="text-xs text-blue-600">Approved</div><div className="text-lg font-bold text-blue-700">{statusCounts.approved}</div></div> : null}
        {statusCounts.processing ? <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 text-center"><div className="text-xs text-purple-600">Processing</div><div className="text-lg font-bold text-purple-700">{statusCounts.processing}</div></div> : null}
        {statusCounts.completed ? <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center"><div className="text-xs text-green-600">Completed</div><div className="text-lg font-bold text-green-700">{statusCounts.completed}</div></div> : null}
      </div>
      {canBulk && <BulkActionBar selectedIds={selectedIds} entityType="payment_batch" tableName="payment_batches" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="Batch" />}
      <DataTable columns={columns} data={batches} searchPlaceholder="Search batch#, amount..." showSearch showExport showColumnToggle exportFilename="payment-batches" pageSize={25}
        onRowClick={b => router.push(`/finance/payments/${b.id}`)}
        emptyIcon={<Wallet size={40} className="text-gray-500" />} emptyTitle="No payment batches found" emptyDescription="Create a payment batch from the Saturday payment cycle"
        emptyAction={<Link href="/finance/payments/new" className="btn-primary text-sm"><Wallet size={15} /> Create Payment Batch</Link>} />
    </>
  )
}
