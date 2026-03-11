'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import BulkActions, { BulkCheckbox, type BulkAction } from '@/components/ui/BulkActions'
import { FolderEdit, ToggleLeft, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface ItemListClientProps {
  items: any[]
  categories: { id: string; name: string; code: string }[]
}

export default function ItemListClient({ items, categories }: ItemListClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<boolean>(true)

  const handleBulkUpdateCategory = async (ids: string[]): Promise<{ success: number; failed: number; errors?: string[] }> => {
    if (!selectedCategory) {
      toast.error('Please select a category')
      return { success: 0, failed: ids.length, errors: ['No category selected'] }
    }

    const res = await fetch('/api/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_items',
        entity_type: 'items',
        ids,
        updates: { category_id: selectedCategory },
      }),
    })
    const result = await res.json()
    if (result.success > 0) {
      toast.success(`${result.success} item(s) updated`)
    }
    setShowCategoryModal(false)
    return result
  }

  const handleBulkUpdateStatus = async (ids: string[]): Promise<{ success: number; failed: number; errors?: string[] }> => {
    const res = await fetch('/api/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_items',
        entity_type: 'items',
        ids,
        updates: { is_active: selectedStatus },
      }),
    })
    const result = await res.json()
    if (result.success > 0) {
      toast.success(`${result.success} item(s) ${selectedStatus ? 'activated' : 'deactivated'}`)
    }
    setShowStatusModal(false)
    return result
  }

  const handleBulkExport = async (ids: string[]): Promise<{ success: number; failed: number; errors?: string[] }> => {
    const selected = items.filter(item => ids.includes(item.id))
    const headers = ['Item Code', 'Generic Name', 'Brand', 'Category', 'Unit', 'HSN', 'GST %']
    const rows = selected.map(item => [
      item.item_code,
      item.generic_name,
      item.brand_name || '',
      item.category?.name || '',
      item.unit,
      item.hsn_code || '',
      item.gst_percent,
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map((v: any) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `items-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`Exported ${selected.length} item(s)`)
    return { success: selected.length, failed: 0 }
  }

  const actions: BulkAction[] = [
    {
      label: 'Update Category',
      icon: <FolderEdit size={14} />,
      onClick: async (ids) => {
        setShowCategoryModal(true)
        // Return a pending result - the actual operation happens after modal selection
        return { success: 0, failed: 0 }
      },
      variant: 'navy',
    },
    {
      label: 'Update Status',
      icon: <ToggleLeft size={14} />,
      onClick: async (ids) => {
        setShowStatusModal(true)
        return { success: 0, failed: 0 }
      },
      variant: 'secondary',
    },
    {
      label: 'Export CSV',
      icon: <Download size={14} />,
      onClick: handleBulkExport,
      variant: 'secondary',
    },
  ]

  const isAllSelected = items.length > 0 && selectedIds.length === items.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length

  return (
    <>
      <div className="overflow-x-auto">
        <table className="data-table">
          <caption className="sr-only">List of items with code, name, brand, category, unit, HSN code, GST percentage, and flags</caption>
          <thead>
            <tr>
              <th scope="col" className="w-10">
                <BulkCheckbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={() => {
                    if (isAllSelected) {
                      setSelectedIds([])
                    } else {
                      setSelectedIds(items.map(i => i.id))
                    }
                  }}
                />
              </th>
              <th scope="col">Item Code</th>
              <th scope="col">Generic Name</th>
              <th scope="col">Brand</th>
              <th scope="col">Category</th>
              <th scope="col">Unit</th>
              <th scope="col">HSN</th>
              <th scope="col">GST %</th>
              <th scope="col">Flags</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr
                key={item.id}
                className={cn(selectedIds.includes(item.id) && 'bg-[#EEF2F9]')}
              >
                <td>
                  <BulkCheckbox
                    checked={selectedIds.includes(item.id)}
                    onChange={() => {
                      if (selectedIds.includes(item.id)) {
                        setSelectedIds(selectedIds.filter(id => id !== item.id))
                      } else {
                        setSelectedIds([...selectedIds, item.id])
                      }
                    }}
                  />
                </td>
                <td>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {item.item_code}
                  </span>
                </td>
                <td>
                  <div className="font-medium text-gray-900">{item.generic_name}</div>
                </td>
                <td className="text-sm text-gray-600">{item.brand_name ?? '\u2014'}</td>
                <td className="text-sm text-gray-600">{item.category?.name ?? '\u2014'}</td>
                <td className="text-sm text-gray-600">{item.unit}</td>
                <td className="text-xs font-mono text-gray-500">{item.hsn_code ?? '\u2014'}</td>
                <td className="text-sm text-gray-600">{item.gst_percent}%</td>
                <td>
                  <div className="flex gap-1">
                    {item.is_narcotic && <span className="badge bg-red-100 text-red-700">Narcotic</span>}
                    {item.is_high_alert && <span className="badge bg-orange-100 text-orange-700">High Alert</span>}
                    {item.is_cold_chain && <span className="badge bg-blue-100 text-blue-700">Cold Chain</span>}
                  </div>
                </td>
                <td>
                  <Link href={`/items/${item.id}`} className="text-xs text-[#0D7E8A] hover:underline font-medium" aria-label={`View item ${item.generic_name}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkActions
        items={items}
        actions={actions}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Category Update Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#1B3A6B] mb-4">Bulk Update Category</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a category to assign to {selectedIds.length} item(s).
            </p>
            <select
              className="form-select mb-6 w-full"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Select Category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCategoryModal(false)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button
                onClick={() => handleBulkUpdateCategory(selectedIds)}
                className="btn-navy text-sm px-4 py-2"
                disabled={!selectedCategory}
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#1B3A6B] mb-4">Bulk Update Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set the status for {selectedIds.length} item(s).
            </p>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setSelectedStatus(true)}
                className={cn(
                  'flex-1 py-3 rounded-lg text-sm font-medium border-2 transition-colors',
                  selectedStatus ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'
                )}
              >
                Active
              </button>
              <button
                onClick={() => setSelectedStatus(false)}
                className={cn(
                  'flex-1 py-3 rounded-lg text-sm font-medium border-2 transition-colors',
                  !selectedStatus ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'
                )}
              >
                Inactive
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowStatusModal(false)} className="btn-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button
                onClick={() => handleBulkUpdateStatus(selectedIds)}
                className="btn-navy text-sm px-4 py-2"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
