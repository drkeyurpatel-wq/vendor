'use client'

import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, ShoppingCart, ChevronDown, ChevronUp, Plus, Minus, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'
import StockActions from '@/components/ui/StockActions'

interface StockRow {
  id: string
  current_stock: number
  reorder_level: number
  max_level: number
  last_grn_date?: string
  last_grn_rate?: number
  item_id: string
  centre_id: string
  item?: { item_code: string; generic_name: string; unit: string; category?: { name: string } | null } | null
  centre?: { code: string; name: string } | null
}

function getStockStatus(current: number, reorder: number) {
  if (current <= 0) return { label: 'OUT', class: 'bg-red-100 text-red-800', bar: 'bg-red-500' }
  if (current <= reorder) return { label: 'LOW', class: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' }
  return { label: 'OK', class: 'bg-green-100 text-green-800', bar: 'bg-green-500' }
}

function StockBar({ current, reorder, max }: { current: number; reorder: number; max: number }) {
  const effectiveMax = max || Math.max(current * 2, reorder * 3, 100)
  const pct = Math.min((current / effectiveMax) * 100, 100)
  const reorderPct = Math.min((reorder / effectiveMax) * 100, 100)
  const status = getStockStatus(current, reorder)
  return (
    <div className="w-full">
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', status.bar)} style={{ width: `${Math.max(pct, 2)}%` }} />
        <div className="absolute top-0 h-full w-px bg-red-400" style={{ left: `${reorderPct}%` }} title={`Reorder: ${reorder}`} />
      </div>
    </div>
  )
}

export default function StockListClient({ stocks, userRole }: { stocks: StockRow[]; userRole: string }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

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
      header: 'Stock Level',
      size: 180,
      cell: ({ row }) => {
        const s = row.original
        const status = getStockStatus(s.current_stock, s.reorder_level)
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-semibold', s.current_stock <= 0 ? 'text-red-600' : s.current_stock <= s.reorder_level ? 'text-yellow-600' : 'text-gray-900')}>
                {s.current_stock} {s.item?.unit}
              </span>
              <span className={cn('badge text-[9px]', status.class)}>{status.label}</span>
            </div>
            <StockBar current={s.current_stock} reorder={s.reorder_level} max={s.max_level} />
          </div>
        )
      },
    },
    {
      accessorKey: 'reorder_level',
      header: 'Reorder / Max',
      size: 120,
      cell: ({ row }) => (
        <div className="text-xs text-gray-600">
          <span className="text-red-500 font-medium">{row.original.reorder_level}</span>
          <span className="text-gray-400"> / </span>
          <span>{row.original.max_level || '—'}</span>
          <span className="text-gray-400 ml-1">{row.original.item?.unit}</span>
        </div>
      ),
    },
    {
      accessorKey: 'last_grn_date',
      header: 'Last GRN',
      size: 100,
      cell: ({ row }) => (
        <div>
          <div className="text-xs text-gray-500">{row.original.last_grn_date ? formatDate(row.original.last_grn_date) : '—'}</div>
          {row.original.last_grn_rate ? <div className="text-xs font-mono text-gray-600">{formatCurrency(row.original.last_grn_rate)}/{row.original.item?.unit}</div> : null}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original
        const isExpanded = expandedRow === s.id
        return (
          <div className="flex items-center gap-1">
            {s.current_stock <= s.reorder_level && s.reorder_level > 0 && (
              <Link href={`/purchase-orders/new?item=${s.item_id}`}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors">
                <ShoppingCart size={10} /> PO
              </Link>
            )}
            <button onClick={() => setExpandedRow(isExpanded ? null : s.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Stock actions">
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )
      },
    },
  ], [expandedRow])

  const outOfStock = stocks.filter(s => s.current_stock <= 0 && s.reorder_level > 0).length
  const lowStock = stocks.filter(s => s.current_stock > 0 && s.current_stock <= s.reorder_level).length
  const totalValue = stocks.reduce((s, r) => s + (r.current_stock * (r.last_grn_rate || 0)), 0)

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-3">
          <div className="text-xs text-gray-500">Total SKUs</div>
          <div className="text-lg font-bold text-navy-600">{stocks.length.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-3">
          <div className="text-xs text-gray-500">Estimated Value</div>
          <div className="text-lg font-bold text-navy-600">₹{Math.round(totalValue).toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 shadow-card p-3">
          <div className="text-xs text-red-600 font-medium">Out of Stock</div>
          <div className="text-lg font-bold text-red-600">{outOfStock}</div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 shadow-card p-3">
          <div className="text-xs text-yellow-600 font-medium">Below Reorder</div>
          <div className="text-lg font-bold text-yellow-600">{lowStock}</div>
        </div>
      </div>

      {/* Expanded row actions */}
      {expandedRow && (() => {
        const s = stocks.find(x => x.id === expandedRow)
        if (!s) return null
        return (
          <div className="mb-4 p-4 bg-blue-50/50 border border-blue-200 rounded-xl animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-mono text-xs text-gray-500">{s.item?.item_code}</span>
                <span className="ml-2 font-semibold text-gray-900">{s.item?.generic_name}</span>
                <span className="ml-2 badge bg-blue-50 text-blue-700">{s.centre?.code}</span>
              </div>
              <button onClick={() => setExpandedRow(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <StockActions
              itemId={s.item_id} itemCode={s.item?.item_code || ''} itemName={s.item?.generic_name || ''}
              centreId={s.centre_id} centreName={`${s.centre?.code} — ${s.centre?.name}`}
              currentStock={s.current_stock} reorderLevel={s.reorder_level} maxLevel={s.max_level}
              unit={s.item?.unit || 'nos'} userRole={userRole}
            />
          </div>
        )
      })()}

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
