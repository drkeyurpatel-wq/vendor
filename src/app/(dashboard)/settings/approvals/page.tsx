import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn, formatCurrency, formatLakhs, formatDate } from '@/lib/utils'
import { Shield, CheckCircle, UserCheck, ArrowRight, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ROLE_LABELS, PO_APPROVAL_THRESHOLD } from '@/types/database'
import type { UserRole } from '@/types/database'

const ROLE_COLORS: Record<string, string> = {
  group_admin: 'bg-purple-100 text-purple-800',
  group_cao: 'bg-blue-100 text-blue-800',
  unit_cao: 'bg-teal-100 text-teal-800',
  unit_purchase_manager: 'bg-green-100 text-green-800',
}

const TIER_COLORS = [
  { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', bar: 'bg-green-500' },
  { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', bar: 'bg-blue-500' },
  { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', bar: 'bg-teal-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', bar: 'bg-orange-500' },
  { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', bar: 'bg-purple-500' },
]

const APPROVAL_MATRIX: {
  range: string
  rangeFrom: number
  rangeTo: number | null
  approver: string
  role: UserRole
  description: string
}[] = [
  {
    range: `Up to ${formatCurrency(PO_APPROVAL_THRESHOLD.auto)}`,
    rangeFrom: 0,
    rangeTo: PO_APPROVAL_THRESHOLD.auto,
    approver: 'Auto-approved',
    role: 'unit_purchase_manager',
    description: 'Low-value POs are automatically approved upon creation',
  },
  {
    range: `${formatCurrency(PO_APPROVAL_THRESHOLD.auto + 1)} - ${formatCurrency(PO_APPROVAL_THRESHOLD.unit_pm)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.auto + 1,
    rangeTo: PO_APPROVAL_THRESHOLD.unit_pm,
    approver: ROLE_LABELS.unit_purchase_manager,
    role: 'unit_purchase_manager',
    description: 'Centre-level purchase manager approval required',
  },
  {
    range: `${formatCurrency(PO_APPROVAL_THRESHOLD.unit_pm + 1)} - ${formatCurrency(PO_APPROVAL_THRESHOLD.unit_cao)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.unit_pm + 1,
    rangeTo: PO_APPROVAL_THRESHOLD.unit_cao,
    approver: ROLE_LABELS.unit_cao,
    role: 'unit_cao',
    description: 'Unit finance officer (CAO) must review and approve',
  },
  {
    range: `${formatCurrency(PO_APPROVAL_THRESHOLD.unit_cao + 1)} - ${formatCurrency(PO_APPROVAL_THRESHOLD.group_cao)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.unit_cao + 1,
    rangeTo: PO_APPROVAL_THRESHOLD.group_cao,
    approver: ROLE_LABELS.group_cao,
    role: 'group_cao',
    description: 'Group-level CAO approval for high-value orders',
  },
  {
    range: `Above ${formatCurrency(PO_APPROVAL_THRESHOLD.group_cao)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.group_cao + 1,
    rangeTo: null,
    approver: ROLE_LABELS.group_admin,
    role: 'group_admin',
    description: 'Managing Director (Keyur) must personally approve',
  },
]

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

export default async function ApprovalsSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['group_admin', 'group_cao'].includes(currentProfile.role)) {
    return (
      <div>
        <h1 className="page-title mb-4">Approval Matrix</h1>
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Access Restricted</p>
          <p className="text-sm text-gray-400 mt-1">Only Group Admin or Group CAO can view approval settings</p>
        </div>
      </div>
    )
  }

  // Fetch approvers and recent activity in parallel
  const approverRoles: UserRole[] = ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin']

  const [{ data: approvers }, { data: recentApprovals }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, email, role, is_active, centre:centres(code, name)')
      .in('role', approverRoles)
      .eq('is_active', true)
      .order('role')
      .order('full_name'),
    supabase
      .from('po_approvals')
      .select(`
        id,
        status,
        comments,
        created_at,
        approver:user_profiles!po_approvals_approved_by_fkey(full_name, role),
        po:purchase_orders!po_approvals_po_id_fkey(po_number, total_amount, centre:centres(code))
      `)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const approversByRole = new Map<string, typeof approvers>()
  approverRoles.forEach(role => approversByRole.set(role, []))
  approvers?.forEach(a => {
    const list = approversByRole.get(a.role) ?? []
    list.push(a)
    approversByRole.set(a.role, list)
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">PO Approval Matrix</h1>
          <p className="page-subtitle">
            Purchase order approval thresholds, authorised approvers, and recent activity
          </p>
        </div>
      </div>

      {/* Visual Stepped Tier Display */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#1B3A6B] uppercase tracking-wide mb-4">
          Approval Thresholds
        </h2>
        <div className="space-y-3">
          {APPROVAL_MATRIX.map((tier, i) => {
            const colors = TIER_COLORS[i]
            return (
              <div
                key={i}
                className={cn(
                  'rounded-lg border-2 overflow-hidden transition-all',
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-stretch">
                  {/* Level indicator bar */}
                  <div className={cn('w-1.5 shrink-0', colors.bar)} />

                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    {/* Level badge */}
                    <div className="flex items-center gap-3 md:min-w-[120px]">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                        i === 0 ? 'bg-green-500' :
                        i === 1 ? 'bg-blue-500' :
                        i === 2 ? 'bg-teal-500' :
                        i === 3 ? 'bg-orange-500' : 'bg-purple-500'
                      )}>
                        {i === 0 ? <CheckCircle size={16} /> : `L${i}`}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {tier.range}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight size={16} className="text-gray-400 hidden md:block shrink-0" />

                    {/* Approver */}
                    <div className="flex items-center gap-2 md:min-w-[200px]">
                      {i === 0 ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <UserCheck size={16} className={colors.icon} />
                      )}
                      <span className="font-semibold text-gray-800 text-sm">{tier.approver}</span>
                      <span className={cn('badge text-xs', ROLE_COLORS[tier.role] || 'bg-gray-100 text-gray-700')}>
                        {ROLE_LABELS[tier.role]}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-gray-500 flex-1">
                      {tier.description}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Authorised Approvers by Role */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#1B3A6B] uppercase tracking-wide mb-4">
          Authorised Approvers by Role
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approverRoles.map(role => {
            const users = approversByRole.get(role) ?? []
            return (
              <div key={role} className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('badge', ROLE_COLORS[role] || 'bg-gray-100 text-gray-700')}>
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''}</span>
                </div>
                {users.length > 0 ? (
                  <ul className="divide-y divide-gray-50">
                    {users.map((u: any) => (
                      <li key={u.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{u.full_name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </div>
                        {u.centre ? (
                          <span className="badge bg-blue-50 text-blue-700 text-xs">
                            {u.centre.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">All Centres</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-gray-400">No active users with this role</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Approval Activity */}
      <div>
        <h2 className="text-sm font-semibold text-[#1B3A6B] uppercase tracking-wide mb-4">
          Recent Approval Activity
        </h2>
        <div className="card overflow-hidden">
          {recentApprovals && recentApprovals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Centre</th>
                    <th>Amount</th>
                    <th>Approver</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Comments</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApprovals.map((approval: any) => (
                    <tr key={approval.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-[#1B3A6B]">
                          {approval.po?.po_number || '—'}
                        </span>
                      </td>
                      <td>
                        {approval.po?.centre ? (
                          <span className="badge bg-blue-50 text-blue-700 text-xs">
                            {approval.po.centre.code}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-sm font-medium text-gray-900">
                        {approval.po?.total_amount
                          ? formatLakhs(approval.po.total_amount)
                          : '—'}
                      </td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">
                          {approval.approver?.full_name || '—'}
                        </div>
                      </td>
                      <td>
                        {approval.approver?.role ? (
                          <span className={cn('badge text-xs', ROLE_COLORS[approval.approver.role] || 'bg-gray-100 text-gray-700')}>
                            {ROLE_LABELS[approval.approver.role as UserRole] || approval.approver.role}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <span className={cn(
                          'badge text-xs flex items-center gap-1 w-fit',
                          APPROVAL_STATUS_COLORS[approval.status] || 'bg-gray-100 text-gray-700'
                        )}>
                          {approval.status === 'approved' && <ThumbsUp size={11} />}
                          {approval.status === 'rejected' && <ThumbsDown size={11} />}
                          {approval.status === 'pending' && <Clock size={11} />}
                          {approval.status ? approval.status.charAt(0).toUpperCase() + approval.status.slice(1) : '—'}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500 max-w-[200px] truncate">
                        {approval.comments || '—'}
                      </td>
                      <td className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(approval.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state py-12">
              <Clock size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No approval activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Approval records will appear here once POs are submitted for approval</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
