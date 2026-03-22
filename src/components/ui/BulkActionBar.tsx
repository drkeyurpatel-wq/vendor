'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Send, CreditCard, Loader2, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'

interface BulkAction {
  key: string
  label: string
  icon: React.ReactNode
  variant: 'primary' | 'danger' | 'warning'
  requireComment?: boolean
  newStatus: string
}

interface Props {
  selectedIds: string[]
  entityType: 'purchase_order' | 'grn' | 'invoice' | 'vendor'
  tableName: string
  actions: BulkAction[]
  onClear: () => void
  entityLabel?: string
}

export default function BulkActionBar({ selectedIds, entityType, tableName, actions, onClear, entityLabel }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeAction, setActiveAction] = useState<BulkAction | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  if (selectedIds.length === 0) return null

  async function executeBulk() {
    if (!activeAction) return
    setLoading(true)

    const updates: Record<string, any> = {
      status: activeAction.newStatus,
      updated_at: new Date().toISOString(),
    }

    if (activeAction.newStatus === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      updates.cancellation_reason = comment || null
    }

    let successCount = 0
    let failCount = 0

    // Process in batches of 20 to avoid rate limits
    for (let i = 0; i < selectedIds.length; i += 20) {
      const batch = selectedIds.slice(i, i + 20)
      const { error } = await supabase.from(tableName).update(updates).in('id', batch)
      if (error) { failCount += batch.length }
      else { successCount += batch.length }
    }

    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        entity_type: entityType, entity_id: selectedIds[0],
        action: `bulk_${activeAction.newStatus}`,
        details: { count: successCount, ids: selectedIds, comment: comment || null },
      })
    } catch {} // Don't fail on audit log error

    if (successCount > 0) {
      toast.success(`${successCount} ${entityLabel || entityType}${successCount > 1 ? 's' : ''} → ${activeAction.newStatus.replace(/_/g, ' ')}`)
    }
    if (failCount > 0) {
      toast.error(`${failCount} failed`)
    }

    setActiveAction(null)
    setComment('')
    setLoading(false)
    onClear()
    router.refresh()
  }

  return (
    <>
      <div className="sticky top-[56px] z-20 bg-navy-600 text-white rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-wrap shadow-lg animate-slide-down">
        <div className="flex items-center gap-2 mr-2">
          <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-1 rounded-lg">{selectedIds.length}</span>
          <span className="text-sm font-medium">selected</span>
        </div>

        <div className="h-5 w-px bg-white/20" />

        {actions.map(action => (
          <button key={action.key} onClick={() => setActiveAction(action)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              action.variant === 'danger' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' :
              action.variant === 'warning' ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200' :
              'bg-white/20 hover:bg-white/30 text-white'
            }`}>
            {action.icon} {action.label}
          </button>
        ))}

        <button onClick={onClear} className="ml-auto text-white/60 hover:text-white transition-colors p-1">
          <X size={16} />
        </button>
      </div>

      {activeAction && (
        <ConfirmDialog
          open={true}
          onClose={() => { setActiveAction(null); setComment('') }}
          title={`Bulk ${activeAction.label}`}
          description={`Apply "${activeAction.label}" to ${selectedIds.length} ${entityLabel || entityType}${selectedIds.length > 1 ? 's' : ''}. This cannot be undone.`}
          confirmLabel={`${activeAction.label} (${selectedIds.length})`}
          confirmVariant={activeAction.variant}
          showCommentBox={activeAction.requireComment}
          requireComment={activeAction.requireComment}
          comment={comment}
          onCommentChange={setComment}
          onConfirm={executeBulk}
        />
      )}
    </>
  )
}
