'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, VENDOR_STATUS_COLORS } from '@/lib/utils'
import { Users, Plus, CheckCircle2, ShieldAlert, Power, Ban } from 'lucide-react'
import Link from 'next/link'
import BulkActionBar from '@/components/ui/BulkActionBar'

interface Vendor {
  id: string
  vendor_code: string
  legal_name: string
  trade_name?: string
  gstin?: string
  gstin_verified?: boolean
  credit_period_days: number
  primary_contact_name?: string
  primary_contact_phone?: string
  status: string
  category?: { name: string } | null
}

interface Props {
  vendors: Vendor[]
  categories: { id: string; name: string; code: string }[]
  activeStatus?: string
  userRole: string
}

export default function VendorListClient({ vendors, categories, activeStatus, userRole }: Props) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = useMemo<ColumnDef<Vendor, any>[]>(() => {
    const cols: ColumnDef<Vendor, any>[] = []

    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === vendors.length && vendors.length > 0}
          onChange={() => setSelectedIds(selectedIds.length === vendors.length ? [] : vendors.map(v => v.id))}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }

    cols.push(
      {
        accessorKey: 'vendor_code', header: 'Code', size: 110,
        cell: ({ row }) => <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{row.original.vendor_code}</span>,
      },
      {
        accessorKey: 'legal_name', header: 'Vendor Name', size: 240,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900 text-sm">{row.original.legal_name}</div>
            {row.original.trade_name && <div className="text-xs text-gray-500 mt-0.5">{row.original.trade_name}</div>}
          </div>
        ),
      },
      {
        id: 'category', header: 'Category', accessorFn: row => row.category?.name ?? '',
        cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.category?.name ?? '—'}</span>,
      },
      {
        accessorKey: 'gstin', header: 'GSTIN',
        cell: ({ row }) => {
          if (!row.original.gstin) return <span className="text-xs text-gray-500">Not provided</span>
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-gray-700">{row.original.gstin}</span>
              {row.original.gstin_verified && <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />}
            </div>
          )
        },
      },
      {
        accessorKey: 'credit_period_days', header: 'Credit', size: 80,
        cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.credit_period_days}d</span>,
      },
      {
        id: 'contact', header: 'Contact', accessorFn: row => row.primary_contact_name ?? '',
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-gray-700">{row.original.primary_contact_name ?? '—'}</div>
            {row.original.primary_contact_phone && <div className="text-xs text-gray-500">{row.original.primary_contact_phone}</div>}
          </div>
        ),
      },
      {
        accessorKey: 'status', header: 'Status', size: 110,
        cell: ({ row }) => (
          <span className={cn('badge', VENDOR_STATUS_COLORS[row.original.status as keyof typeof VENDOR_STATUS_COLORS])}>
            {row.original.status === 'blacklisted' && <ShieldAlert size={11} className="mr-1" />}
            {row.original.status}
          </span>
        ),
      },
    )
    return cols
  }, [selectedIds, vendors.length, canBulk])

  const statusCounts = vendors.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc }, {} as Record<string, number>)

  const bulkActions = [
    { key: 'activate', label: 'Activate', icon: <Power size={12} />, variant: 'primary' as const, newStatus: 'active' },
    { key: 'deactivate', label: 'Deactivate', icon: <Power size={12} />, variant: 'warning' as const, newStatus: 'inactive' },
    { key: 'blacklist', label: 'Blacklist', icon: <Ban size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'blacklisted' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-lg font-bold text-navy-600">{vendors.length}</div>
        </div>
        {Object.entries(statusCounts).sort().map(([status, count]) => (
          <div key={status} className={cn('bg-white rounded-xl border p-3',
            status === 'active' ? 'border-green-200' : status === 'blacklisted' ? 'border-red-200' : 'border-gray-200')}>
            <div className={cn('text-xs capitalize', status === 'active' ? 'text-green-600' : status === 'blacklisted' ? 'text-red-600' : 'text-gray-500')}>{status}</div>
            <div className="text-lg font-bold text-gray-900">{count}</div>
          </div>
        ))}
      </div>

      {canBulk && (
        <BulkActionBar selectedIds={selectedIds} entityType="vendor" tableName="vendors"
          actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="vendor" />
      )}

      <DataTable
        columns={columns} data={vendors}
        searchPlaceholder="Search vendor name, code, GSTIN..."
        showSearch showExport showColumnToggle exportFilename="vendors" pageSize={25}
        onRowClick={vendor => router.push(`/vendors/${vendor.id}`)}
        emptyIcon={<Users size={40} className="text-gray-500" />}
        emptyTitle={activeStatus ? 'No vendors match this filter' : 'No vendors yet'}
        emptyDescription={activeStatus ? 'Try a different status' : 'Add your first vendor'}
        emptyAction={!activeStatus ? <Link href="/vendors/new" className="btn-primary text-sm"><Plus size={15} /> Add Vendor</Link> : undefined}
      />
    </>
  )
}
