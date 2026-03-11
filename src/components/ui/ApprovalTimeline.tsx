import { cn, formatDateTime } from '@/lib/utils'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { ROLE_LABELS } from '@/types/database'
import type { UserRole } from '@/types/database'

interface Approval {
  id: string
  approval_level: number
  approver_role: string
  status: string
  comments: string | null
  approved_at: string | null
  approved_by: string | null
}

interface Props {
  approvals: Approval[]
  autoApproved?: boolean
}

export default function ApprovalTimeline({ approvals, autoApproved = false }: Props) {
  if (autoApproved && approvals.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle size={16} />
        <span>Auto-approved (amount under Rs 10,000)</span>
      </div>
    )
  }

  if (approvals.length === 0) {
    return <p className="text-sm text-gray-400">No approval records</p>
  }

  return (
    <div className="space-y-4">
      {approvals.map((a, idx) => (
        <div key={a.id} className="relative flex items-start gap-3">
          {/* Connector line */}
          {idx < approvals.length - 1 && (
            <div className="absolute left-[9px] top-[22px] w-0.5 h-[calc(100%+8px)] bg-gray-200" />
          )}

          {/* Icon */}
          {a.status === 'approved' ? (
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0 relative z-10 bg-white" />
          ) : a.status === 'rejected' ? (
            <XCircle size={18} className="text-red-500 mt-0.5 shrink-0 relative z-10 bg-white" />
          ) : (
            <Clock size={18} className="text-yellow-500 mt-0.5 shrink-0 relative z-10 bg-white" />
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">
                Level {a.approval_level}
              </span>
              <span className="text-xs text-gray-500">
                {ROLE_LABELS[a.approver_role as UserRole] || a.approver_role?.replace(/_/g, ' ')}
              </span>
              <span className={cn('badge text-xs',
                a.status === 'approved' ? 'bg-green-100 text-green-700' :
                a.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {a.status}
              </span>
            </div>
            {a.comments && (
              <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{a.comments}&rdquo;</p>
            )}
            {a.approved_at && (
              <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(a.approved_at)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
