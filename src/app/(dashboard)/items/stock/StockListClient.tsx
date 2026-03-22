'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface StockRow {
  id: string
  current_stock: number
  reorder_level: number
  max_level: number
  last_grn_date?: string
  last_grn_rate?: number
  item_id: string
  item?: { item_code: string; generic_name: string; unit: string; category?: { name: string } | null } | null
  centre?: { code: string; name: string } | null
}

function getStockStatus(current: number, reorder: number) {
  if (current <= 0) return { label: 'OUT', class: 'bg-red-100 text-red-800' }
  if (current <= reorder) return { label: 'LOW', class: 'bg-yellow-100 text-yellow-800' }
  return { label: 'OK', class: 'bg-green-100 text-green-800' }
}

export default function StockListClient({ stocks }: { stocks: StockRow[] }) {
  const columns = useMemo<ColumnDef<StockRow, any>[]>(() => [
    {
      id: 'item_code',
      header: 'Code',
      accessorFn: row => row.item?.item_code ?? '',
      size: 110,
      cell: ({ row }) => <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">{row.original.item?.item_code}</span>,
    },
    {
      id: 'item_name',
      header: 'Item',
      accessorFn: row => row.item?.generic_name ?? '',
      cell: ({ row }) => (
        <div>
          <Link href={`/items/${row.original.item_id}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">{row.original.item?.generic_name}</Link>
          {row.original.item?.category?.name && <div className="text-xs text-gray-400">{row.original.item.category.name}</div>}
        </div>
      ),
    },
    {
      id: 'centre',
      header: 'Centre',
      accessorFn: row => row.centre?.code ?? '',
      size: 80,
      cell: ({ row }) => <span className="badge bg-blue-50 text-blue-700">{row.original.centre?.code}</span>,
    },
    {
      accessorKey: 'current_stock',
      header: 'Current Stock',
      size: 120,
      cell: ({ row }) => {
        const s = row.original
        const status = getStockStatus(s.current_stock, s.reorder_level)
        return (
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold', s.current_stock <= 0 ? 'text-red-600' : s.current_stock <= s.reorder_level ? 'text-yellow-600' : 'text-gray-900')}>
              {s.current_stock} {s.item?.unit}
            </span>
            <span className={cn('badge text-[9px]', status.class)}>{status.label}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'reorder_level',
      header: 'Reorder At',
      size: 100,
      cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.reorder_level} {row.original.item?.unit}</span>,
    },
    {
      accessorKey: 'max_level',
      header: 'Max',
      size: 80,
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.max_level || '—'}</span>,
    },
    {
      accessorKey: 'last_grn_date',
      header: 'Last GRN',
      size: 100,
      cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.last_grn_date ? formatDate(row.original.last_grn_date) : '—'}</span>,
    },
    {
      accessorKey: 'last_grn_rate',
      header: 'Last Rate',
      size: 90,
      cell: ({ row }) => <span className="text-xs font-mono text-gray-600">{row.original.last_grn_rate ? formatCurrency(row.original.last_grn_rate) : '—'}</span>,
    },
    {
      id: 'actions',
      header: '',
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original
        if (s.current_stock <= s.reorder_level && s.reorder_level > 0) {
          return (
            <Link href={`/purchase-orders/new?item=${s.item_id}`}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors">
              <ShoppingCart size={10} /> Raise PO
            </Link>
          )
        }
        return null
      },
    },
  ], [])

  const outOfStock = stocks.filter(s => s.current_stock <= 0 && s.reorder_level > 0).length
  const lowStock = stocks.filter(s => s.current_stock > 0 && s.current_stock <= s.reorder_level).length

  return (
    <>
      {/* Alert banner */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="mb-4 flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-red-700 font-medium">{outOfStock} out of stock</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <AlertTriangle size={14} className="text-yellow-500" />
              <span className="text-yellow-700 font-medium">{lowStock} below reorder level</span>
            </div>
          )}
        </div>
      )}
      <DataTable
        columns={columns}
        data={stocks}
        searchPlaceholder="Search item code, name, centre..."
        showSearch
        showExport
        showColumnToggle
        exportFilename="stock-levels"
        pageSize={50}
        emptyIcon={<Package size={40} className="text-gray-300" />}
        emptyTitle="No stock data"
        emptyDescription="Stock levels populate when GRNs are verified"
      />
    </>
  )
}
