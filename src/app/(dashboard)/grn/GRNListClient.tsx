'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, formatLakhs, formatDate } from '@/lib/utils'
import { Package, CheckCircle2, XCircle, AlertTriangle, Eye, Printer, FileText, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'
import toast from 'react-hot-toast'

const GRN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800', discrepancy: 'bg-red-100 text-red-800',
}

interface GRN {
  id: string
  grn_number: string
  grn_date: string
  status: string
  quality_status?: string
  vendor_invoice_no?: string
  vendor_invoice_amount?: number
  vendor?: { legal_name: string } | null
  centre?: { code: string } | null
  po?: { po_number: string } | null
}

function getGRNRowActions(grn: GRN, userRole: string): RowAction[] {
  const canVerify = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager', 'store_staff'].includes(userRole)
  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/grn/${grn.id}` },
    {
      key: 'verify', label: 'Verify GRN', icon: <CheckCircle2 size={14} />, variant: 'primary',
      confirm: true, confirmTitle: `Verify GRN ${grn.grn_number}`,
      confirmDescription: `Mark GRN ${grn.grn_number} as verified. This confirms received goods match the PO.`,
      statusField: 'status', newStatus: 'verified',
      visible: grn.status === 'submitted' && canVerify, divider: true,
    },
    {
      key: 'discrepancy', label: 'Flag discrepancy', icon: <AlertTriangle size={14} />, variant: 'warning',
      confirm: true, requireComment: true,
      confirmTitle: `Flag discrepancy on ${grn.grn_number}`,
      confirmDescription: 'Describe the discrepancy found (quantity mismatch, damage, wrong items, etc.).',
      statusField: 'status', newStatus: 'discrepancy',
      visible: ['submitted', 'draft'].includes(grn.status) && canVerify,
    },
    {
      key: 'resubmit', label: 'Resubmit for verification', icon: <RotateCcw size={14} />,
      statusField: 'status', newStatus: 'submitted',
      visible: grn.status === 'discrepancy',
    },
    {
      key: 'create_invoice', label: 'Create invoice from GRN', icon: <FileText size={14} />,
      href: `/finance/invoices/new?grn_id=${grn.id}`,
      visible: grn.status === 'verified', divider: true,
    },
    {
      key: 'pdf', label: 'Download PDF', icon: <Printer size={14} />,
      onExecute: async (id) => {
        try {
          const res = await fetch(`/api/pdf/grn?id=${id}`)
          if (!res.ok) throw new Error('PDF generation failed')
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a'); a.href = url; a.download = `${grn.grn_number}.pdf`; a.click()
          URL.revokeObjectURL(url)
        } catch (err: any) { toast.error(err.message || 'Failed to generate PDF') }
        return false
      },
    },
  ]
}

export default function GRNListClient({ grns, userRole }: { grns: GRN[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = useMemo<ColumnDef<GRN, any>[]>(() => {
    const cols: ColumnDef<GRN, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === grns.length && grns.length > 0}
          onChange={() => setSelectedIds(selectedIds.length === grns.length ? [] : grns.map(g => g.id))}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      {
        accessorKey: 'grn_number', header: 'GRN #', size: 180,
        cell: ({ row }) => <Link href={`/grn/${row.original.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{row.original.grn_number}</Link>,
      },
      { id: 'po', header: 'PO #', accessorFn: r => r.po?.po_number ?? '', size: 160, cell: ({ row }) => row.original.po?.po_number ? <span className="font-mono text-xs text-gray-600">{row.original.po.po_number}</span> : <span className="text-xs text-gray-500">—</span> },
      { id: 'centre', header: 'Centre', accessorFn: r => r.centre?.code ?? '', size: 70, cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span> },
      { id: 'vendor', header: 'Vendor', accessorFn: r => r.vendor?.legal_name ?? '', cell: ({ row }) => <span className="text-sm font-medium text-gray-900 truncate max-w-[180px] block">{row.original.vendor?.legal_name}</span> },
      { accessorKey: 'grn_date', header: 'Date', size: 100, cell: ({ row }) => <span className="text-sm text-gray-600">{formatDate(row.original.grn_date)}</span> },
      { accessorKey: 'vendor_invoice_amount', header: 'Amount', size: 100, cell: ({ row }) => <span className="text-sm font-semibold">{row.original.vendor_invoice_amount ? formatLakhs(row.original.vendor_invoice_amount) : '—'}</span> },
      { accessorKey: 'status', header: 'Status', size: 100, cell: ({ row }) => <span className={cn('badge', GRN_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>{row.original.status}</span> },
      {
        accessorKey: 'quality_status', header: 'QC', size: 90,
        cell: ({ row }) => {
          const qs = row.original.quality_status || 'pending'
          return <span className={cn('badge', qs === 'approved' ? 'bg-green-100 text-green-800' : qs === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600')}>{qs}</span>
        },
      },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => (
          <RowActions entityId={row.original.id} tableName="grns" entityType="grn" entityLabel="GRN"
            actions={getGRNRowActions(row.original, userRole)} notification={{ action: 'grn_status_change' }} />
        ),
      },
    )
    return cols
  }, [selectedIds, grns.length, canBulk, userRole])

  const pendingCount = grns.filter(g => g.status === 'submitted' || g.status === 'draft').length
  const discrepancyCount = grns.filter(g => g.status === 'discrepancy').length

  const bulkActions = [
    { key: 'verify', label: 'Verify', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'verified' },
    { key: 'discrepancy', label: 'Flag Discrepancy', icon: <AlertTriangle size={12} />, variant: 'warning' as const, requireComment: true, newStatus: 'discrepancy' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3">
          <div className="text-xs text-gray-500">Total GRNs</div><div className="text-lg font-bold text-navy-600">{grns.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-3">
          <div className="text-xs text-gray-500">Total Value</div><div className="text-sm font-bold text-navy-600">{formatLakhs(grns.reduce((s, g) => s + (g.vendor_invoice_amount || 0), 0))}</div>
        </div>
        {pendingCount > 0 && <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3"><div className="text-xs text-yellow-600">Pending Verification</div><div className="text-lg font-bold text-yellow-700">{pendingCount}</div></div>}
        {discrepancyCount > 0 && <div className="bg-red-50 rounded-xl border border-red-200 p-3"><div className="text-xs text-red-600">Discrepancies</div><div className="text-lg font-bold text-red-700">{discrepancyCount}</div></div>}
      </div>
      {canBulk && <BulkActionBar selectedIds={selectedIds} entityType="grn" tableName="grns" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="GRN" />}
      <DataTable columns={columns} data={grns} searchPlaceholder="Search GRN#, PO#, vendor..." showSearch showExport showColumnToggle exportFilename="grns" pageSize={25}
        onRowClick={g => router.push(`/grn/${g.id}`)}
        emptyIcon={<Package size={40} className="text-gray-500" />} emptyTitle="No GRNs found" emptyDescription="GRNs are created when goods arrive against a PO" />
    </>
  )
}
