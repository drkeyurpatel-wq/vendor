'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'
import { VENDOR_STATUS_COLORS } from '@/lib/utils'
import { Users, Plus, CheckCircle2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

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

interface VendorListClientProps {
  vendors: Vendor[]
  categories: { id: string; name: string; code: string }[]
  activeStatus?: string
}

export default function VendorListClient({ vendors, categories, activeStatus }: VendorListClientProps) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<Vendor, any>[]>(() => [
    {
      accessorKey: 'vendor_code',
      header: 'Code',
      size: 110,
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
          {row.original.vendor_code}
        </span>
      ),
    },
    {
      accessorKey: 'legal_name',
      header: 'Vendor Name',
      size: 240,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{row.original.legal_name}</div>
          {row.original.trade_name && (
            <div className="text-xs text-gray-400 mt-0.5">{row.original.trade_name}</div>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessorFn: row => row.category?.name ?? '',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.category?.name ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'gstin',
      header: 'GSTIN',
      cell: ({ row }) => {
        if (!row.original.gstin) return <span className="text-xs text-gray-400">Not provided</span>
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs text-gray-700">{row.original.gstin}</span>
            {row.original.gstin_verified && (
              <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'credit_period_days',
      header: 'Credit',
      size: 80,
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.credit_period_days}d</span>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      accessorFn: row => row.primary_contact_name ?? '',
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-gray-700">{row.original.primary_contact_name ?? '—'}</div>
          {row.original.primary_contact_phone && (
            <div className="text-xs text-gray-400">{row.original.primary_contact_phone}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 110,
      cell: ({ row }) => {
        const status = row.original.status as keyof typeof VENDOR_STATUS_COLORS
        return (
          <span className={cn('badge', VENDOR_STATUS_COLORS[status])}>
            {row.original.status === 'blacklisted' && <ShieldAlert size={11} className="mr-1" />}
            {row.original.status}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          href={`/vendors/${row.original.id}`}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
          onClick={e => e.stopPropagation()}
        >
          View
        </Link>
      ),
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={vendors}
      searchPlaceholder="Search vendor name, code, GSTIN..."
      showSearch
      showExport
      showColumnToggle
      exportFilename="vendors"
      pageSize={25}
      onRowClick={(vendor) => router.push(`/vendors/${vendor.id}`)}
      emptyIcon={<Users size={40} className="text-gray-300" />}
      emptyTitle={activeStatus ? 'No vendors match this filter' : 'No vendors yet'}
      emptyDescription={activeStatus ? 'Try selecting a different status tab' : 'Start by adding your first vendor to the system'}
      emptyAction={
        !activeStatus ? (
          <Link href="/vendors/new" className="btn-primary text-sm">
            <Plus size={15} /> Add First Vendor
          </Link>
        ) : undefined
      }
    />
  )
}
