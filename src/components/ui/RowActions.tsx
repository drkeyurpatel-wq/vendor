'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MoreVertical, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from './ConfirmDialog'
import { fireNotification } from '@/lib/notifications'

// ─── Types ────────────────────────────────────────────────

export interface RowAction {
  key: string
  label: string
  icon: React.ReactNode
  /** primary = teal, danger = red, warning = amber, secondary = gray */
  variant?: 'primary' | 'danger' | 'warning' | 'secondary'
  /** If true, shows confirmation dialog before executing */
  confirm?: boolean
  /** Custom confirm dialog title. Default: "Confirm {label}" */
  confirmTitle?: string
  /** Custom confirm dialog description */
  confirmDescription?: string
  /** If true, shows a comment box in confirm dialog */
  requireComment?: boolean
  /** Direct status update — sets this column = newValue on the entity */
  statusField?: string
  newStatus?: string
  /** Additional fields to update alongside status */
  extraUpdates?: Record<string, any>
  /** Custom handler — overrides status update. Return false to prevent router.refresh() */
  onExecute?: (id: string, comment?: string) => Promise<boolean | void>
  /** Navigate to this path instead of executing an action */
  href?: string
  /** Predicate: should this action be shown for this row? */
  visible?: boolean
  /** Predicate: is this action disabled for this row? */
  disabled?: boolean
  /** Tooltip when disabled */
  disabledReason?: string
  /** Divider above this action */
  divider?: boolean
}

interface RowActionsProps {
  entityId: string
  tableName: string
  entityType: string
  entityLabel?: string
  actions: RowAction[]
  /** Called after successful action. Default: router.refresh() */
  onComplete?: () => void
  /** Notification config — fires after successful status change */
  notification?: {
    action: string
    details?: Record<string, any>
  }
}

// ─── Component ────────────────────────────────────────────

export default function RowActions({
  entityId, tableName, entityType, entityLabel, actions, onComplete, notification,
}: RowActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<RowAction | null>(null)
  const [comment, setComment] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  const visibleActions = actions.filter(a => a.visible !== false)

  const executeAction = useCallback(async (action: RowAction) => {
    // Navigate action — just push and close
    if (action.href) {
      router.push(action.href)
      setOpen(false)
      return
    }

    // Confirm required — open dialog first
    if (action.confirm && !activeAction) {
      setActiveAction(action)
      setOpen(false)
      return
    }

    setLoading(true)

    try {
      // Custom handler
      if (action.onExecute) {
        const result = await action.onExecute(entityId, comment || undefined)
        if (result !== false) {
          if (onComplete) onComplete()
          else router.refresh()
        }
        toast.success(`${entityLabel || entityType} → ${action.label}`)
      }
      // Standard status update
      else if (action.statusField && action.newStatus) {
        const updates: Record<string, any> = {
          [action.statusField]: action.newStatus,
          updated_at: new Date().toISOString(),
          ...action.extraUpdates,
        }

        if (action.newStatus === 'cancelled') {
          updates.cancelled_at = new Date().toISOString()
          if (comment) updates.cancellation_reason = comment
        }

        const { error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', entityId)

        if (error) throw error

        toast.success(`${entityLabel || entityType} → ${action.newStatus.replace(/_/g, ' ')}`)

        // Fire notification if configured
        if (notification) {
          fireNotification({
            action: notification.action || `${entityType}_${action.newStatus}`,
            entity_type: entityType,
            entity_id: entityId,
            details: { ...notification.details, status: action.newStatus, comment: comment || undefined },
          })
        }

        // Audit log (non-blocking)
        supabase.from('audit_logs').insert({
          entity_type: entityType,
          entity_id: entityId,
          action: `row_${action.key}`,
          details: { new_status: action.newStatus, comment: comment || null },
        }).then(() => {}, () => {})

        if (onComplete) onComplete()
        else router.refresh()
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${action.label.toLowerCase()}`)
    } finally {
      setLoading(false)
      setActiveAction(null)
      setComment('')
    }
  }, [entityId, tableName, entityType, entityLabel, comment, supabase, router, onComplete, notification, activeAction])

  if (visibleActions.length === 0) return null

  return (
    <>
      <div className="relative">
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev) }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          aria-label="Row actions"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <MoreVertical size={16} />
        </button>

        {open && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-white rounded-xl border border-gray-200 shadow-lg py-1 animate-slide-down"
            role="menu"
          >
            {visibleActions.map((action, idx) => (
              <div key={action.key}>
                {action.divider && idx > 0 && <div className="border-t border-gray-100 my-1" />}
                <button
                  role="menuitem"
                  disabled={action.disabled || loading}
                  title={action.disabled ? action.disabledReason : undefined}
                  onClick={(e) => { e.stopPropagation(); executeAction(action) }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                    action.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : action.variant === 'danger'
                        ? 'text-red-600 hover:bg-red-50'
                        : action.variant === 'warning'
                          ? 'text-amber-700 hover:bg-amber-50'
                          : action.variant === 'primary'
                            ? 'text-teal-700 hover:bg-teal-50'
                            : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {loading && activeAction?.key === action.key
                    ? <Loader2 size={14} className="animate-spin" />
                    : action.icon}
                  <span>{action.label}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog for destructive/important actions */}
      {activeAction?.confirm && (
        <ConfirmDialog
          open={true}
          onClose={() => { setActiveAction(null); setComment('') }}
          title={activeAction.confirmTitle || `Confirm ${activeAction.label}`}
          description={activeAction.confirmDescription || `Are you sure you want to ${activeAction.label.toLowerCase()} this ${entityLabel || entityType}? This cannot be undone.`}
          confirmLabel={activeAction.label}
          confirmVariant={activeAction.variant === 'danger' ? 'danger' : activeAction.variant === 'warning' ? 'warning' : 'primary'}
          showCommentBox={activeAction.requireComment}
          requireComment={activeAction.requireComment}
          comment={comment}
          onCommentChange={setComment}
          onConfirm={() => executeAction(activeAction)}
        />
      )}
    </>
  )
}
