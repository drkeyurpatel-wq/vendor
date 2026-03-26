'use client'

import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary' | 'warning'
  showCommentBox?: boolean
  comment?: string
  onCommentChange?: (val: string) => void
  requireComment?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', confirmVariant = 'primary',
  showCommentBox, comment, onCommentChange, requireComment
}: Props) {
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, loading, onClose])

  if (!open) return null

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    primary: 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-500',
  }

  async function handleConfirm() {
    if (requireComment && (!comment || !comment.trim())) return
    setLoading(true)
    try { await onConfirm() }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div ref={ref} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
        <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 text-gray-500 hover:text-gray-600">
          <X size={18} />
        </button>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-xl ${confirmVariant === 'danger' ? 'bg-red-100' : confirmVariant === 'warning' ? 'bg-amber-100' : 'bg-teal-100'}`}>
            <AlertTriangle size={20} className={confirmVariant === 'danger' ? 'text-red-600' : confirmVariant === 'warning' ? 'text-amber-600' : 'text-teal-600'} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>

        {showCommentBox && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              {requireComment ? 'Reason (required)' : 'Comments (optional)'}
            </label>
            <textarea
              className="form-input text-sm"
              rows={3}
              value={comment || ''}
              onChange={e => onCommentChange?.(e.target.value)}
              placeholder="Enter reason..."
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={loading} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading || (requireComment && (!comment || !comment.trim()))}
            className={`text-sm px-4 py-2 rounded-lg text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${variantClasses[confirmVariant]}`}
          >
            {loading ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Processing...</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
