'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatLakhs, formatDate, PO_STATUS_COLORS } from '@/lib/utils'
import { canApprovePO, type UserRole } from '@/types/database'
import BulkActions, { BulkCheckbox, type BulkAction } from '@/components/ui/BulkActions'
import { CheckCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface POListClientProps {
  pos: any[]
  userRole: UserRole
}

export default function POListClient({ pos, userRole }: POListClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const canBulkApprove = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)

  const handleBulkApprove = async (ids: string[]): Promise<{ success: number; failed: number; errors?: string[] }> => {
    const res = await fetch('/api/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve_pos',
        entity_type: 'purchase_orders',
        ids,
      }),
    })
    const result = await res.json()
    if (result.success > 0) {
      toast.success(`${result.success} PO(s) approved`)
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} PO(s) failed`)
    }
    return result
  }

  const handleBulkExport = async (ids: string[]): Promise<{ success: number; failed: number; errors?: string[] }> => {
    // Build CSV from selected POs
    const selected = pos.filter(po => ids.includes(po.id))
    const headers = ['PO Number', 'Centre', 'Vendor', 'Date', 'Amount', 'Status']
    const rows = selected.map(po => [
      po.po_number,
      po.centre?.code || '',
      po.vendor?.legal_name || '',
      po.po_date,
      po.total_amount,
      po.status,
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map((v: any) => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase-orders-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success(`Exported ${selected.length} PO(s)`)
    return { success: selected.length, failed: 0 }
  }

  const actions: BulkAction[] = []

  if (canBulkApprove) {
    // Only show approve action if there are pending POs selected
    const pendingSelected = pos.filter(
      po => selectedIds.includes(po.id) && po.status === 'pending_approval'
    )
    if (pendingSelected.length > 0) {
      actions.push({
        label: 'Bulk Approve',
        icon: <CheckCircle size={14} />,
        onClick: handleBulkApprove,
        variant: 'primary',
        confirmMessage: `Are you sure you want to approve ${pendingSelected.length} purchase order(s)? This action cannot be undone.`,
      })
    }
  }

  actions.push({
    label: 'Export CSV',
    icon: <Download size={14} />,
    onClick: handleBulkExport,
    variant: 'secondary',
  })

  const isAllSelected = pos.length > 0 && selectedIds.length === pos.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < pos.length

  return (
    <>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">
                <BulkCheckbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={() => {
                    if (isAllSelected) {
                      setSelectedIds([])
                    } else {
                      setSelectedIds(pos.map((po: any) => po.id))
                    }
                  }}
                />
              </th>
              <th>PO Number</th>
              <th>Centre</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Expected Delivery</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po: any) => (
              <tr
                key={po.id}
                className={cn(selectedIds.includes(po.id) && 'bg-[#EEF2F9]')}
              >
                <td>
                  <BulkCheckbox
                    checked={selectedIds.includes(po.id)}
                    onChange={() => {
                      if (selectedIds.includes(po.id)) {
                        setSelectedIds(selectedIds.filter(id => id !== po.id))
                      } else {
                        setSelectedIds([...selectedIds, po.id])
                      }
                    }}
                  />
                </td>
                <td>
                  <span className="font-mono text-xs font-semibold">{po.po_number}</span>
                </td>
                <td>
                  <span className="badge bg-blue-50 text-blue-700">{po.centre?.code}</span>
                </td>
                <td className="text-sm font-medium text-gray-900">{po.vendor?.legal_name}</td>
                <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                <td className="text-sm text-gray-600">
                  {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '\u2014'}
                </td>
                <td className="text-sm font-semibold text-gray-900">{formatLakhs(po.total_amount)}</td>
                <td>
                  <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                    {po.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <Link href={`/purchase-orders/${po.id}`} className="text-xs text-[#0D7E8A] hover:underline font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkActions
        items={pos}
        actions={actions}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </>
  )
}
