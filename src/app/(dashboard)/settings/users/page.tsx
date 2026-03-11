import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import { Shield } from 'lucide-react'
import { ROLE_LABELS, isGroupLevel } from '@/types/database'
import type { UserRole } from '@/types/database'
import UserFormModal from './UserFormModal'

const ROLE_COLORS: Record<string, string> = {
  group_admin: 'bg-purple-100 text-purple-800',
  group_cao: 'bg-blue-100 text-blue-800',
  unit_cao: 'bg-teal-100 text-teal-800',
  unit_purchase_manager: 'bg-green-100 text-green-800',
  store_staff: 'bg-orange-100 text-orange-800',
  finance_staff: 'bg-yellow-100 text-yellow-800',
  vendor: 'bg-gray-100 text-gray-700',
}

export default async function SettingsUsersPage() {
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
        <h1 className="page-title mb-4">User Management</h1>
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Access Restricted</p>
          <p className="text-sm text-gray-400 mt-1">Only Group Admin can manage users</p>
        </div>
      </div>
    )
  }

  const [{ data: users }, { data: centres }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*, centre:centres(code, name)')
      .order('role')
      .order('full_name'),
    supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
  ])

  const roleGroups = new Map<string, any[]>()
  users?.forEach(u => {
    const role = u.role || 'unknown'
    if (!roleGroups.has(role)) roleGroups.set(role, [])
    roleGroups.get(role)!.push(u)
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users?.length ?? 0} users across all centres</p>
        </div>
        <UserFormModal centres={centres ?? []} />
      </div>

      {/* Summary by role */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className="stat-card text-center">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-xl font-bold text-[#1B3A6B] mt-1">
              {roleGroups.get(role)?.length || 0}
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Centre</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id}>
                  <td className="font-medium text-gray-900">{u.full_name}</td>
                  <td className="text-sm text-gray-600">{u.email}</td>
                  <td>
                    <span className={cn('badge', ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700')}>
                      {ROLE_LABELS[u.role as UserRole] || u.role}
                    </span>
                  </td>
                  <td>
                    {u.centre ? (
                      <span className="badge bg-blue-50 text-blue-700">{u.centre.code} — {u.centre.name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">{isGroupLevel(u.role) ? 'All Centres' : '—'}</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-600">{u.phone || '—'}</td>
                  <td>
                    <span className={cn('badge', u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-500">{formatDate(u.created_at)}</td>
                  <td>
                    <UserFormModal
                      centres={centres ?? []}
                      editUser={{
                        id: u.id,
                        full_name: u.full_name,
                        email: u.email,
                        phone: u.phone,
                        role: u.role,
                        centre_id: u.centre_id,
                        is_active: u.is_active,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
