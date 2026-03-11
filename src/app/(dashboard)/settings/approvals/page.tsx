import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn, formatCurrency } from '@/lib/utils'
import { Shield, CheckCircle, UserCheck } from 'lucide-react'
import { ROLE_LABELS, PO_APPROVAL_THRESHOLD } from '@/types/database'
import type { UserRole } from '@/types/database'

const ROLE_COLORS: Record<string, string> = {
  group_admin: 'bg-purple-100 text-purple-800',
  group_cao: 'bg-blue-100 text-blue-800',
  unit_cao: 'bg-teal-100 text-teal-800',
  unit_purchase_manager: 'bg-green-100 text-green-800',
}

const APPROVAL_MATRIX: {
  range: string
  rangeFrom: number
  rangeTo: number | null
  approver: string
  role: UserRole
}[] = [
  {
    range: `Up to ${formatCurrency(PO_APPROVAL_THRESHOLD.auto)}`,
    rangeFrom: 0,
    rangeTo: PO_APPROVAL_THRESHOLD.auto,
    approver: 'Auto-approved',
    role: 'unit_purchase_manager',
  },
  {
    range: `${formatCurrency(PO_APPROVAL_THRESHOLD.auto + 1)} – ${formatCurrency(PO_APPROVAL_THRESHOLD.unit_pm)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.auto + 1,
    rangeTo: PO_APPROVAL_THRESHOLD.unit_pm,
    approver: ROLE_LABELS.unit_purchase_manager,
    role: 'unit_purchase_manager',
  },
  {
    range: `${formatCurrency(PO_APPROVAL_THRESHOLD.unit_pm + 1)} – ${formatCurrency(PO_APPROVAL_THRESHOLD.unit_cao)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.unit_pm + 1,
    rangeTo: PO_APPROVAL_THRESHOLD.unit_cao,
    approver: ROLE_LABELS.unit_cao,
    role: 'unit_cao',
  },
  {
    range: `${formatCurrency(PO_APPROVAL_THRESHOLD.unit_cao + 1)} – ${formatCurrency(PO_APPROVAL_THRESHOLD.group_cao)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.unit_cao + 1,
    rangeTo: PO_APPROVAL_THRESHOLD.group_cao,
    approver: ROLE_LABELS.group_cao,
    role: 'group_cao',
  },
  {
    range: `Above ${formatCurrency(PO_APPROVAL_THRESHOLD.group_cao)}`,
    rangeFrom: PO_APPROVAL_THRESHOLD.group_cao + 1,
    rangeTo: null,
    approver: ROLE_LABELS.group_admin,
    role: 'group_admin',
  },
]

export default async function ApprovalsSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || currentProfile.role !== 'group_admin') {
    return (
      <div>
        <h1 className="page-title mb-4">Approval Matrix</h1>
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Access Restricted</p>
          <p className="text-sm text-gray-400 mt-1">Only Group Admin can view approval settings</p>
        </div>
      </div>
    )
  }

  const approverRoles: UserRole[] = ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin']

  const { data: approvers } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role, is_active, centre:centres(code, name)')
    .in('role', approverRoles)
    .eq('is_active', true)
    .order('role')
    .order('full_name')

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
            Purchase order approval thresholds and authorised approvers
          </p>
        </div>
      </div>

      {/* Approval Thresholds Table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-[#1B3A6B]">Approval Thresholds</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Amount Range</th>
                <th>Required Approver</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {APPROVAL_MATRIX.map((tier, i) => (
                <tr key={i}>
                  <td>
                    <span className="font-medium text-gray-900">{tier.range}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {i === 0 ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <UserCheck size={14} className="text-[#0D7E8A]" />
                      )}
                      <span className="text-sm text-gray-700">{tier.approver}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn('badge', ROLE_COLORS[tier.role] || 'bg-gray-100 text-gray-700')}>
                      {ROLE_LABELS[tier.role]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approvers by Role */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-[#1B3A6B] mb-4">Authorised Approvers by Role</h2>
      </div>

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
  )
}
