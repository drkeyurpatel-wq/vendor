'use client'

import { useState, useCallback } from 'react'
import { CheckSquare, Square, X, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BulkAction {
  label: string
  icon?: React.ReactNode
  onClick: (selectedIds: string[]) => Promise<{ success: number; failed: number; errors?: string[] }>
  variant?: 'primary' | 'navy' | 'danger' | 'secondary'
  confirmMessage?: string
}

interface BulkActionsProps {
  items: { id: string; [key: string]: unknown }[]
  actions: BulkAction[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function BulkCheckbox({
  checked,
  onChange,
  indeterminate,
}: {
  checked: boolean
  onChange: () => void
  indeterminate?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-[#0D7E8A] transition-colors"
    >
      {indeterminate ? (
        <div className="w-4 h-4 rounded border-2 border-[#0D7E8A] bg-[#0D7E8A] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-white rounded" />
        </div>
      ) : checked ? (
        <CheckSquare size={18} className="text-[#0D7E8A]" />
      ) : (
        <Square size={18} />
      )}
    </button>
  )
}

export default function BulkActions({
  items,
  actions,
  selectedIds,
  onSelectionChange,
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null)
  const [progress, setProgress] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const isAllSelected = items.length > 0 && selectedIds.length === items.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length

  const toggleAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map(i => i.id))
    }
  }, [items, isAllSelected, onSelectionChange])

  const toggleItem = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter(i => i !== id))
      } else {
        onSelectionChange([...selectedIds, id])
      }
    },
    [selectedIds, onSelectionChange]
  )

  const executeAction = async (action: BulkAction) => {
    setConfirmAction(null)
    setLoading(true)
    setProgress(null)

    try {
      const result = await action.onClick(selectedIds)
      setProgress({
        success: result.success,
        failed: result.failed,
        errors: result.errors || [],
      })
      if (result.success > 0 && result.failed === 0) {
        // Clear selection on full success after a short delay
        setTimeout(() => {
          onSelectionChange([])
          setProgress(null)
        }, 2000)
      }
    } catch (err) {
      setProgress({
        success: 0,
        failed: selectedIds.length,
        errors: [(err as Error).message],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action: BulkAction) => {
    if (action.confirmMessage) {
      setConfirmAction(action)
    } else {
      executeAction(action)
    }
  }

  const variantClass = (variant?: string) => {
    switch (variant) {
      case 'primary': return 'btn-primary'
      case 'navy': return 'btn-navy'
      case 'danger': return 'btn-danger'
      default: return 'btn-secondary'
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <>
      {/* Floating action bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-2xl border border-gray-200 rounded-xl px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 flex-wrap justify-center max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[#1B3A6B]">
          <CheckSquare size={16} className="text-[#0D7E8A]" />
          <span>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Processing...
          </div>
        ) : progress ? (
          <div className="flex items-center gap-2 text-sm">
            {progress.failed === 0 ? (
              <span className="text-green-600 font-medium">
                {progress.success} processed successfully
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                {progress.success} succeeded, {progress.failed} failed
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleActionClick(action)}
                className={cn(variantClass(action.variant), 'text-sm px-3 py-1.5 flex items-center gap-1.5')}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            onSelectionChange([])
            setProgress(null)
          }}
          className="text-gray-400 hover:text-gray-600 ml-1"
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#1B3A6B]">Confirm Action</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction.confirmMessage}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will affect <strong>{selectedIds.length}</strong> item{selectedIds.length > 1 ? 's' : ''}.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="btn-secondary text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(confirmAction)}
                className="btn-danger text-sm px-4 py-2"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { BulkActions }
