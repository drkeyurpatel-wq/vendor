'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import { cn, VENDOR_STATUS_COLORS } from '@/lib/utils'
import { Building2, Eye, Edit, CheckCircle2, XCircle, Ban, FileText, ShoppingCart, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'

interface Vendor {
  id: string
  vendor_code: string
  legal_name: string
  status: string
  gst_number?: string
  contact_person?: string
  phone?: string
  category?: { name: string } | null
  centre?: { code: string } | null
  _po_count?: number
}

function getVendorRowActions(v: Vendor, userRole: string): RowAction[] {
  const isAdmin = ['group_admin', 'group_cao'].includes(userRole)
  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/vendors/${v.id}` },
    { key: 'edit', label: 'Edit vendor', icon: <Edit size={14} />, href: `/vendors/${v.id}` },
    { key: 'docs', label: 'Manage documents', icon: <FileText size={14} />, href: `/vendors/${v.id}/documents` },
    { key: 'create_po', label: 'Create PO for vendor', icon: <ShoppingCart size={14} />, href: `/purchase-orders/new?vendor_id=${v.id}`, divider: true },
    {
      key: 'activate', label: 'Activate', icon: <CheckCircle2 size={14} />, variant: 'primary',
      confirm: true, statusField: 'status', newStatus: 'active',
      visible: v.status !== 'active' && v.status !== 'blacklisted' && isAdmin,
      divider: true,
    },
    {
      key: 'deactivate', label: 'Deactivate', icon: <XCircle size={14} />, variant: 'warning',
      confirm: true, requireComment: true,
      confirmTitle: `Deactivate ${v.legal_name}`,
      confirmDescription: 'Deactivated vendors cannot receive new POs. Existing POs will not be affected.',
      statusField: 'status', newStatus: 'inactive',
      visible: v.status === 'active' && isAdmin,
    },
    {
      key: 'review', label: 'Put under review', icon: <AlertTriangle size={14} />, variant: 'warning',
      confirm: true, requireComment: true,
      statusField: 'status', newStatus: 'under_review',
      visible: v.status === 'active' && isAdmin,
    },
    {
      key: 'blacklist', label: 'Blacklist vendor', icon: <Ban size={14} />, variant: 'danger',
      confirm: true, requireComment: true,
      confirmTitle: `Blacklist ${v.legal_name}`,
      confirmDescription: 'Only group_admin can blacklist. This vendor will be permanently blocked from all POs. Are you absolutely sure?',
      statusField: 'status', newStatus: 'blacklisted',
      visible: v.status !== 'blacklisted' && userRole === 'group_admin',
      divider: true,
    },
  ]
}

export default function VendorListClient({ vendors, userRole }: { vendors: Vendor[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao'].includes(userRole)

  function toggleSelect(id: string) { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const columns = useMemo<ColumnDef<Vendor, any>[]>(() => {
    const cols: ColumnDef<Vendor, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === vendors.length && vendors.length > 0} onChange={() => setSelectedIds(selectedIds.length === vendors.length ? [] : vendors.map(v => v.id))} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'vendor_code', header: 'Code', size: 100, cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.vendor_code}</span> },
      { accessorKey: 'legal_name', header: 'Vendor Name', cell: ({ row }) => <Link href={`/vendors/${row.original.id}`} className="text-sm font-medium text-teal-600 hover:underline truncate max-w-[220px] block">{row.original.legal_name}</Link> },
      { id: 'category', header: 'Category', accessorFn: r => r.category?.name ?? '', size: 120, cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.category?.name || '—'}</span> },
      { accessorKey: 'gst_number', header: 'GST', size: 160, cell: ({ row }) => <span className="font-mono text-xs text-gray-500">{row.original.gst_number || '—'}</span> },
      { accessorKey: 'contact_person', header: 'Contact', size: 120, cell: ({ row }) => <span className="text-sm text-gray-700">{row.original.contact_person || '—'}</span> },
      { accessorKey: 'phone', header: 'Phone', size: 120, cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.phone || '—'}</span> },
      {
        accessorKey: 'status', header: 'Status', size: 110,
        cell: ({ row }) => <span className={cn('badge', VENDOR_STATUS_COLORS[row.original.status as keyof typeof VENDOR_STATUS_COLORS] || 'bg-gray-100 text-gray-700')}>{row.original.status.replace(/_/g, ' ')}</span>,
      },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => <RowActions entityId={row.original.id} tableName="vendors" entityType="vendor" entityLabel="Vendor" actions={getVendorRowActions(row.original, userRole)} notification={{ action: 'vendor_status_change' }} />,
      },
    )
    return cols
  }, [selectedIds, vendors.length, canBulk, userRole])

  const statusCounts = vendors.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc }, {} as Record<string, number>)
  const bulkActions = [
    { key: 'activate', label: 'Activate', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'active' },
    { key: 'deactivate', label: 'Deactivate', icon: <XCircle size={12} />, variant: 'warning' as const, newStatus: 'inactive' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Total</div><div className="text-lg font-bold text-navy-600">{vendors.length}</div></div>
        {statusCounts.active ? <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center"><div className="text-xs text-green-600">Active</div><div className="text-lg font-bold text-green-700">{statusCounts.active}</div></div> : null}
        {statusCounts.pending ? <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center"><div className="text-xs text-yellow-600">Pending</div><div className="text-lg font-bold text-yellow-700">{statusCounts.pending}</div></div> : null}
        {statusCounts.under_review ? <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center"><div className="text-xs text-blue-600">Under Review</div><div className="text-lg font-bold text-blue-700">{statusCounts.under_review}</div></div> : null}
        {statusCounts.blacklisted ? <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center"><div className="text-xs text-red-600">Blacklisted</div><div className="text-lg font-bold text-red-700">{statusCounts.blacklisted}</div></div> : null}
      </div>
      {canBulk && <BulkActionBar selectedIds={selectedIds} entityType="vendor" tableName="vendors" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="Vendor" />}
      <DataTable columns={columns} data={vendors} searchPlaceholder="Search vendor name, code, GST..." showSearch showExport showColumnToggle exportFilename="vendors" pageSize={25}
        onRowClick={v => router.push(`/vendors/${v.id}`)}
        emptyIcon={<Building2 size={40} className="text-gray-500" />} emptyTitle="No vendors found" emptyDescription="Add your first vendor to start procurement"
        emptyAction={<Link href="/vendors/new" className="btn-primary text-sm"><Plus size={15} /> Add First Vendor</Link>} />
    </>
  )
}
