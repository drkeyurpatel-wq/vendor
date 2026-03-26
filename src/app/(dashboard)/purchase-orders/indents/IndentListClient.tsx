'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, formatDate } from '@/lib/utils'
import { ClipboardList, CheckCircle2, XCircle, Eye, ShoppingCart, Printer, Edit } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const INDENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
  ordered: 'bg-purple-100 text-purple-800', received: 'bg-teal-100 text-teal-800',
  cancelled: 'bg-red-50 text-red-600',
}

interface Indent {
  id: string
  indent_number: string
  indent_date: string
  status: string
  priority?: string
  department?: string
  total_items?: number
  requested_by?: { full_name: string } | null
  centre?: { code: string } | null
}

function getIndentRowActions(indent: Indent, userRole: string): RowAction[] {
  const canApprove = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/purchase-orders/indents/${indent.id}` },
    { key: 'edit', label: 'Edit indent', icon: <Edit size={14} />, href: `/purchase-orders/indents/${indent.id}`, visible: indent.status === 'draft' },
    {
      key: 'approve', label: 'Approve', icon: <CheckCircle2 size={14} />, variant: 'primary',
      confirm: true, confirmTitle: `Approve indent ${indent.indent_number}`,
      statusField: 'status', newStatus: 'approved',
      visible: indent.status === 'submitted' && canApprove, divider: true,
    },
    {
      key: 'reject', label: 'Reject', icon: <XCircle size={14} />, variant: 'danger',
      confirm: true, requireComment: true,
      confirmTitle: `Reject indent ${indent.indent_number}`,
      confirmDescription: 'This indent will be sent back to the requester. Please provide a reason.',
      statusField: 'status', newStatus: 'rejected',
      visible: indent.status === 'submitted' && canApprove,
    },
    {
      key: 'convert_po', label: 'Convert to PO', icon: <ShoppingCart size={14} />, variant: 'primary',
      onExecute: async (id) => {
        try {
          const res = await fetch('/api/indent/convert', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ indent_id: id }),
          })
          if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Conversion failed') }
          const data = await res.json()
          toast.success(`PO ${data.po_number} created from indent`)
          return true
        } catch (err: any) { toast.error(err.message); return false }
      },
      visible: indent.status === 'approved', divider: true,
    },
    {
      key: 'cancel', label: 'Cancel', icon: <XCircle size={14} />, variant: 'danger',
      confirm: true, requireComment: true,
      statusField: 'status', newStatus: 'cancelled',
      visible: ['draft', 'submitted'].includes(indent.status), divider: true,
    },
    {
      key: 'pdf', label: 'Download PDF', icon: <Printer size={14} />,
      onExecute: async (id) => {
        try {
          const res = await fetch(`/api/pdf/indent?id=${id}`)
          if (!res.ok) throw new Error('PDF generation failed')
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${indent.indent_number}.pdf`; a.click()
          URL.revokeObjectURL(url)
        } catch (err: any) { toast.error(err.message || 'Failed') }
        return false
      },
    },
  ]
}

export default function IndentListClient({ indents, userRole }: { indents: Indent[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)

  function toggleSelect(id: string) { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const columns = useMemo<ColumnDef<Indent, any>[]>(() => {
    const cols: ColumnDef<Indent, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === indents.length && indents.length > 0} onChange={() => setSelectedIds(selectedIds.length === indents.length ? [] : indents.map(i => i.id))} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'indent_number', header: 'Indent #', size: 180, cell: ({ row }) => <Link href={`/purchase-orders/indents/${row.original.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{row.original.indent_number}</Link> },
      { id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 70, cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
      { accessorKey: 'department', header: 'Department', size: 120, cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.department || '—'}</span> },
      { id: 'requested_by', header: 'Requested by', accessorFn: r => r.requested_by?.full_name ?? '', cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.requested_by?.full_name || '—'}</span> },
      { accessorKey: 'indent_date', header: 'Date', size: 100, cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.indent_date)}</span> },
      {
        accessorKey: 'priority', header: 'Priority', size: 80,
        cell: ({ row }) => {
          const p = row.original.priority || 'normal'
          return <span className={cn('badge', p === 'emergency' ? 'bg-red-100 text-red-700' : p === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600')}>{p}</span>
        },
      },
      { accessorKey: 'status', header: 'Status', size: 100, cell: ({ row }) => <span className={cn('badge', INDENT_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>{row.original.status}</span> },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => <RowActions entityId={row.original.id} tableName="purchase_indents" entityType="indent" entityLabel="Indent" actions={getIndentRowActions(row.original, userRole)} notification={{ action: 'indent_status_change' }} />,
      },
    )
    return cols
  }, [selectedIds, indents.length, canBulk, userRole])

  const statusCounts = indents.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc }, {} as Record<string, number>)
  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'reject', label: 'Reject', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'rejected' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Total</div><div className="text-lg font-bold text-navy-600">{indents.length}</div></div>
        {statusCounts.submitted ? <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center"><div className="text-xs text-blue-600">Submitted</div><div className="text-lg font-bold text-blue-700">{statusCounts.submitted}</div></div> : null}
        {statusCounts.approved ? <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center"><div className="text-xs text-green-600">Approved</div><div className="text-lg font-bold text-green-700">{statusCounts.approved}</div></div> : null}
        {statusCounts.ordered ? <div className="bg-purple-50 rounded-xl border border-purple-200 p-3 text-center"><div className="text-xs text-purple-600">Ordered</div><div className="text-lg font-bold text-purple-700">{statusCounts.ordered}</div></div> : null}
        {statusCounts.rejected ? <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center"><div className="text-xs text-red-600">Rejected</div><div className="text-lg font-bold text-red-700">{statusCounts.rejected}</div></div> : null}
      </div>
      {canBulk && <BulkActionBar selectedIds={selectedIds} entityType="indent" tableName="purchase_indents" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="Indent" />}
      <DataTable columns={columns} data={indents} searchPlaceholder="Search indent#, department..." showSearch showExport showColumnToggle exportFilename="indents" pageSize={25}
        onRowClick={i => router.push(`/purchase-orders/indents/${i.id}`)}
        emptyIcon={<ClipboardList size={40} className="text-gray-500" />} emptyTitle="No indents found" emptyDescription="Staff can raise purchase requests from their dashboard" />
    </>
  )
}
