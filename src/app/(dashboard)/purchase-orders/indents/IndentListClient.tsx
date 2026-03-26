'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate } from '@/lib/utils'
import { ClipboardList, Plus, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'

const INDENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
  converted_to_po: 'bg-purple-100 text-purple-800', cancelled: 'bg-red-100 text-red-700',
}
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600', normal: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-800', emergency: 'bg-red-100 text-red-800',
}

interface Indent {
  id: string; indent_number: string; status: string; priority: string
  notes?: string; created_at: string
  centre?: { code: string; name: string } | null
  created_by_user?: { full_name: string } | null
}

export default function IndentListClient({ indents, userRole }: { indents: Indent[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = useMemo<ColumnDef<Indent, any>[]>(() => {
    const cols: ColumnDef<Indent, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === indents.length && indents.length > 0}
          onChange={() => setSelectedIds(selectedIds.length === indents.length ? [] : indents.map(i => i.id))}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'indent_number', header: 'Indent #', size: 180,
        cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.indent_number}</span> },
      { id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 80,
        cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
      { accessorKey: 'priority', header: 'Priority', size: 90,
        cell: ({ row }) => <span className={cn('badge', PRIORITY_COLORS[row.original.priority] || 'bg-gray-100 text-gray-700')}>{row.original.priority}</span> },
      { id: 'requested_by', header: 'Requested By', accessorFn: r => r.created_by_user?.full_name ?? '',
        cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.created_by_user?.full_name || '—'}</span> },
      { accessorKey: 'created_at', header: 'Date', size: 100,
        cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.created_at)}</span> },
      { accessorKey: 'status', header: 'Status', size: 120,
        cell: ({ row }) => <span className={cn('badge', INDENT_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>{row.original.status?.replace(/_/g, ' ')}</span> },
      { id: 'actions', header: '', size: 120, enableSorting: false,
        cell: ({ row }) => row.original.status === 'approved' ? (
          <Link href={`/purchase-orders/new?indent=${row.original.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors"
            onClick={e => e.stopPropagation()}>
            Convert to PO <ArrowRight size={12} />
          </Link>
        ) : null },
    )
    return cols
  }, [selectedIds, indents.length, canBulk])

  const pendingCount = indents.filter(i => i.status === 'submitted').length
  const approvedCount = indents.filter(i => i.status === 'approved').length

  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'reject', label: 'Reject', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'rejected' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3">
          <div className="text-xs text-gray-500">Total Indents</div>
          <div className="text-lg font-bold text-navy-600">{indents.length}</div>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3">
            <div className="text-xs text-yellow-600">Pending Approval</div>
            <div className="text-lg font-bold text-yellow-700">{pendingCount}</div>
          </div>
        )}
        {approvedCount > 0 && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-3">
            <div className="text-xs text-green-600">Ready for PO</div>
            <div className="text-lg font-bold text-green-700">{approvedCount}</div>
          </div>
        )}
      </div>

      {canBulk && (
        <BulkActionBar selectedIds={selectedIds} entityType="purchase_order" tableName="indents"
          actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="indent" />
      )}

      <DataTable columns={columns} data={indents}
        searchPlaceholder="Search indent #, centre..." showSearch showExport exportFilename="indents" pageSize={25}
        onRowClick={indent => router.push(`/purchase-orders/indents/${indent.id}`)}
        emptyIcon={<ClipboardList size={40} className="text-gray-500" />}
        emptyTitle="No indents found" emptyDescription="Indents are internal procurement requests"
        emptyAction={<Link href="/purchase-orders/indents/new" className="btn-primary text-sm"><Plus size={15} /> New Indent</Link>} />
    </>
  )
}
