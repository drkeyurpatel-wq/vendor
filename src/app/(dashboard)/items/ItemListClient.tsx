'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn } from '@/lib/utils'
import { Package, Plus, Snowflake, AlertTriangle, Pill } from 'lucide-react'
import Link from 'next/link'

interface Item {
  id: string
  item_code: string
  generic_name: string
  brand_name?: string
  unit: string
  hsn_code?: string
  gst_percent: number
  is_cold_chain?: boolean
  is_narcotic?: boolean
  is_high_alert?: boolean
  is_active?: boolean
  category?: { name: string; code: string } | null
}

interface ItemListClientProps {
  items: Item[]
  categories: { id: string; name: string; code: string; parent_id?: string }[]
  totalCount: number
}

export default function ItemListClient({ items, categories, totalCount }: ItemListClientProps) {
  const router = useRouter()

  const columns = useMemo<ColumnDef<Item, any>[]>(() => [
    {
      accessorKey: 'item_code',
      header: 'Code',
      size: 120,
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
          {row.original.item_code}
        </span>
      ),
    },
    {
      accessorKey: 'generic_name',
      header: 'Item Name',
      size: 280,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{row.original.generic_name}</div>
          {row.original.brand_name && (
            <div className="text-xs text-gray-500 mt-0.5">{row.original.brand_name}</div>
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
      accessorKey: 'unit',
      header: 'Unit',
      size: 80,
      cell: ({ row }) => (
        <span className="text-sm text-gray-600 capitalize">{row.original.unit}</span>
      ),
    },
    {
      accessorKey: 'hsn_code',
      header: 'HSN',
      size: 90,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-gray-500">{row.original.hsn_code || '—'}</span>
      ),
    },
    {
      accessorKey: 'gst_percent',
      header: 'GST %',
      size: 70,
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.gst_percent}%</span>
      ),
    },
    {
      id: 'flags',
      header: 'Flags',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => {
        const flags = []
        if (row.original.is_cold_chain) flags.push({ icon: <Snowflake size={12} />, label: 'Cold', color: 'text-blue-600 bg-blue-50' })
        if (row.original.is_narcotic) flags.push({ icon: <Pill size={12} />, label: 'Narcotic', color: 'text-red-600 bg-red-50' })
        if (row.original.is_high_alert) flags.push({ icon: <AlertTriangle size={12} />, label: 'High Alert', color: 'text-amber-600 bg-amber-50' })
        if (flags.length === 0) return <span className="text-xs text-gray-500">—</span>
        return (
          <div className="flex gap-1 flex-wrap">
            {flags.map((f, i) => (
              <span key={i} className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium', f.color)} title={f.label}>
                {f.icon}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      id: 'status',
      header: 'Status',
      size: 80,
      accessorFn: row => row.is_active ? 'active' : 'inactive',
      cell: ({ row }) => (
        <span className={cn(
          'badge',
          row.original.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        )}>
          {row.original.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={items}
      searchPlaceholder="Search item name, code, brand, HSN..."
      showSearch
      showExport
      showColumnToggle
      exportFilename="items"
      pageSize={50}
      onRowClick={(item) => router.push(`/items/${item.id}`)}
      emptyIcon={<Package size={40} className="text-gray-500" />}
      emptyTitle="No items in the system"
      emptyDescription="Add your first SKU to get started with inventory management"
      emptyAction={
        <Link href="/items/new" className="btn-primary text-sm">
          <Plus size={15} /> Add First Item
        </Link>
      }
    />
  )
}
