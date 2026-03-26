'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import RowActions, { type RowAction } from '@/components/ui/RowActions'
import BulkActionBar from '@/components/ui/BulkActionBar'
import { cn, formatLakhs } from '@/lib/utils'
import { Package, Eye, Edit, Copy, Archive, RotateCcw, Plus, ShoppingCart, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Item {
  id: string
  item_code: string
  name: string
  generic_name?: string
  is_active: boolean
  unit_of_measurement?: string
  hsn_code?: string
  category?: { name: string } | null
  last_purchase_rate?: number
  reorder_level?: number
  current_stock?: number
}

function getItemRowActions(item: Item, userRole: string): RowAction[] {
  const isAdmin = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  return [
    { key: 'view', label: 'View details', icon: <Eye size={14} />, href: `/items/${item.id}` },
    { key: 'edit', label: 'Edit item', icon: <Edit size={14} />, href: `/items/${item.id}/edit` },
    { key: 'stock', label: 'View stock levels', icon: <Package size={14} />, href: `/items/stock?item=${item.id}` },
    {
      key: 'create_indent', label: 'Raise indent', icon: <ShoppingCart size={14} />,
      href: `/purchase-orders/indents/new?item_id=${item.id}`,
      visible: item.is_active, divider: true,
    },
    {
      key: 'deactivate', label: 'Deactivate item', icon: <Archive size={14} />, variant: 'warning',
      confirm: true, confirmTitle: `Deactivate ${item.name}`,
      confirmDescription: 'Deactivated items cannot be added to new POs. Existing POs will not be affected.',
      onExecute: async (id) => {
        const supabase = createClient()
        const { error } = await supabase.from('items').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
        if (error) { toast.error(error.message); return false }
        toast.success(`${item.name} deactivated`)
        return true
      },
      visible: item.is_active && isAdmin,
      divider: true,
    },
    {
      key: 'reactivate', label: 'Reactivate item', icon: <RotateCcw size={14} />, variant: 'primary',
      onExecute: async (id) => {
        const supabase = createClient()
        const { error } = await supabase.from('items').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', id)
        if (error) { toast.error(error.message); return false }
        toast.success(`${item.name} reactivated`)
        return true
      },
      visible: !item.is_active && isAdmin,
      divider: true,
    },
  ]
}

export default function ItemListClient({ items, userRole }: { items: Item[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)

  function toggleSelect(id: string) { setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  const columns = useMemo<ColumnDef<Item, any>[]>(() => {
    const cols: ColumnDef<Item, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === items.length && items.length > 0} onChange={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map(i => i.id))} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)} onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'item_code', header: 'Code', size: 110, cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.item_code}</span> },
      {
        accessorKey: 'name', header: 'Item Name',
        cell: ({ row }) => (
          <div>
            <Link href={`/items/${row.original.id}`} className="text-sm font-medium text-teal-600 hover:underline truncate max-w-[220px] block">{row.original.name}</Link>
            {row.original.generic_name && <span className="text-xs text-gray-500">{row.original.generic_name}</span>}
          </div>
        ),
      },
      { id: 'category', header: 'Category', accessorFn: r => r.category?.name ?? '', size: 120, cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.category?.name || '—'}</span> },
      { accessorKey: 'unit_of_measurement', header: 'Unit', size: 70, cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.unit_of_measurement || '—'}</span> },
      { accessorKey: 'hsn_code', header: 'HSN', size: 90, cell: ({ row }) => <span className="font-mono text-xs text-gray-500">{row.original.hsn_code || '—'}</span> },
      {
        accessorKey: 'last_purchase_rate', header: 'Last Rate', size: 100,
        cell: ({ row }) => row.original.last_purchase_rate ? <span className="text-sm font-semibold">{formatLakhs(row.original.last_purchase_rate)}</span> : <span className="text-xs text-gray-400">—</span>,
      },
      {
        id: 'stock_status', header: 'Stock', size: 90,
        cell: ({ row }) => {
          const stock = row.original.current_stock ?? 0
          const reorder = row.original.reorder_level ?? 0
          const isLow = reorder > 0 && stock <= reorder
          return (
            <div className="flex items-center gap-1">
              <span className={cn('text-sm font-medium', isLow ? 'text-red-600' : 'text-gray-700')}>{stock}</span>
              {isLow && <TrendingDown size={12} className="text-red-500" />}
            </div>
          )
        },
      },
      {
        id: 'is_active', header: 'Active', size: 60,
        cell: ({ row }) => <span className={cn('w-2 h-2 rounded-full inline-block', row.original.is_active ? 'bg-green-500' : 'bg-gray-300')} title={row.original.is_active ? 'Active' : 'Inactive'} />,
      },
      {
        id: 'actions', header: '', size: 50, enableSorting: false,
        cell: ({ row }) => <RowActions entityId={row.original.id} tableName="items" entityType="item" entityLabel="Item" actions={getItemRowActions(row.original, userRole)} />,
      },
    )
    return cols
  }, [selectedIds, items.length, canBulk, userRole])

  const activeCount = items.filter(i => i.is_active).length
  const lowStockCount = items.filter(i => i.is_active && (i.reorder_level ?? 0) > 0 && (i.current_stock ?? 0) <= (i.reorder_level ?? 0)).length

  const bulkActions = [
    { key: 'deactivate', label: 'Deactivate', icon: <Archive size={12} />, variant: 'warning' as const, newStatus: 'false' },
    { key: 'activate', label: 'Activate', icon: <RotateCcw size={12} />, variant: 'primary' as const, newStatus: 'true' },
  ]

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-xl border border-gray-200/80 p-3 text-center"><div className="text-xs text-gray-500">Total Items</div><div className="text-lg font-bold text-navy-600">{items.length}</div></div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center"><div className="text-xs text-green-600">Active</div><div className="text-lg font-bold text-green-700">{activeCount}</div></div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-center"><div className="text-xs text-gray-500">Inactive</div><div className="text-lg font-bold text-gray-600">{items.length - activeCount}</div></div>
        {lowStockCount > 0 && <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center"><div className="text-xs text-red-600">Low Stock</div><div className="text-lg font-bold text-red-700">{lowStockCount}</div></div>}
      </div>
      {canBulk && <BulkActionBar selectedIds={selectedIds} entityType="vendor" tableName="items" actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="Item" />}
      <DataTable columns={columns} data={items} searchPlaceholder="Search item name, code, HSN..." showSearch showExport showColumnToggle exportFilename="items" pageSize={25}
        onRowClick={i => router.push(`/items/${i.id}`)}
        emptyIcon={<Package size={40} className="text-gray-500" />} emptyTitle="No items found" emptyDescription="Add items to your inventory to start procurement"
        emptyAction={<Link href="/items/new" className="btn-primary text-sm"><Plus size={15} /> Add First Item</Link>} />
    </>
  )
}
