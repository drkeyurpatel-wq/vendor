import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  Shield, Search, Calendar, Download, ChevronLeft, ChevronRight,
  User, Activity, Filter, Clock
} from 'lucide-react'

interface SearchParams {
  page?: string
  action?: string
  entity_type?: string
  user_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

const ENTITY_LINKS: Record<string, (id: string) => string> = {
  purchase_order: (id) => `/purchase-orders/${id}`,
  purchase: (id) => `/purchase-orders/${id}`,
  grn: (id) => `/grn/${id}`,
  invoice: () => `/finance/invoices`,
  vendor: (id) => `/vendors/${id}`,
  item: (id) => `/items/${id}`,
  payment: () => `/finance/payments`,
}

const PAGE_SIZE = 50

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(*)')
    .eq('id', user.id)
    .single()

  if (!profile || !['group_admin', 'group_cao'].includes(profile.role)) {
    redirect('/')
  }

  const page = parseInt(params.page || '1', 10)
  const offset = (page - 1) * PAGE_SIZE

  // Build query
  let query = supabase
    .from('activity_log')
    .select('*, user:user_profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (params.action) {
    query = query.eq('action', params.action)
  }
  if (params.entity_type) {
    query = query.eq('entity_type', params.entity_type)
  }
  if (params.user_id) {
    query = query.eq('user_id', params.user_id)
  }
  if (params.search) {
    query = query.or(`entity_id.eq.${params.search},action.ilike.%${params.search}%`)
  }
  if (params.date_from) {
    query = query.gte('created_at', `${params.date_from}T00:00:00`)
  }
  if (params.date_to) {
    query = query.lte('created_at', `${params.date_to}T23:59:59`)
  }

  const { data: logs, count: totalCount } = await query

  // Summary stats for today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: todayCount } = await supabase
    .from('activity_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())

  // Unique users today
  const { data: todayUsers } = await supabase
    .from('activity_log')
    .select('user_id')
    .gte('created_at', todayStart.toISOString())

  const uniqueUsers = new Set(todayUsers?.map(u => u.user_id) || []).size

  // Get list of users for filter
  const { data: allUsers } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name')

  // Get distinct actions for filter
  const { data: actionList } = await supabase
    .from('activity_log')
    .select('action')
    .limit(100)

  const uniqueActions = Array.from(new Set(actionList?.map(a => a.action) || [])).sort()

  const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const base = new URLSearchParams()
    const merged = { ...params, ...overrides }
    for (const [key, val] of Object.entries(merged)) {
      if (val) base.set(key, val)
    }
    return `/settings/audit-log?${base.toString()}`
  }

  return (
    <div>
      <div className="page-header mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={24} />
            Audit Log
          </h1>
          <p className="page-subtitle">Complete activity trail for the system</p>
        </div>
        <a
          href={`/api/export?type=audit_log&date_from=${params.date_from || ''}&date_to=${params.date_to || ''}`}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={16} />
          Export CSV
        </a>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEF2F9] flex items-center justify-center">
              <Activity size={20} className="text-[#1B3A6B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1B3A6B]">{todayCount || 0}</p>
              <p className="text-xs text-gray-500">Events Today</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E6F5F6] flex items-center justify-center">
              <User size={20} className="text-[#0D7E8A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1B3A6B]">{uniqueUsers}</p>
              <p className="text-xs text-gray-500">Active Users Today</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EEF2F9] flex items-center justify-center">
              <Clock size={20} className="text-[#1B3A6B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1B3A6B]">{totalCount || 0}</p>
              <p className="text-xs text-gray-500">Total Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form method="GET" action="/settings/audit-log">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="search"
                type="text"
                placeholder="Search entity ID..."
                defaultValue={params.search || ''}
                className="form-input pl-10 w-full"
              />
            </div>

            {/* Action Type */}
            <select name="action" defaultValue={params.action || ''} className="form-select">
              <option value="">All Actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {/* Entity Type */}
            <select name="entity_type" defaultValue={params.entity_type || ''} className="form-select">
              <option value="">All Entity Types</option>
              <option value="purchase_order">Purchase Order</option>
              <option value="grn">GRN</option>
              <option value="invoice">Invoice</option>
              <option value="vendor">Vendor</option>
              <option value="item">Item</option>
              <option value="payment">Payment</option>
              <option value="debit_note">Debit Note</option>
              <option value="credit_note">Credit Note</option>
            </select>

            {/* User */}
            <select name="user_id" defaultValue={params.user_id || ''} className="form-select">
              <option value="">All Users</option>
              {allUsers?.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>

            {/* Date From */}
            <div className="relative">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="date_from"
                type="date"
                defaultValue={params.date_from || ''}
                className="form-input pl-10 w-full"
                placeholder="From"
              />
            </div>

            {/* Date To */}
            <div className="flex gap-2">
              <input
                name="date_to"
                type="date"
                defaultValue={params.date_to || ''}
                className="form-input w-full"
                placeholder="To"
              />
              <button type="submit" className="btn-primary px-4 flex-shrink-0">
                <Search size={14} />
              </button>
            </div>
          </div>
          {(params.action || params.entity_type || params.user_id || params.search || params.date_from || params.date_to) && (
            <div className="mt-2">
              <Link href="/settings/audit-log" className="text-xs text-[#0D7E8A] hover:underline">
                Clear all filters
              </Link>
            </div>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state py-12">
                      <Activity size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">No audit log entries found</p>
                    </div>
                  </td>
                </tr>
              )}
              {logs?.map((log: any) => {
                const entityLinkFn = log.entity_type ? ENTITY_LINKS[log.entity_type] : null
                const entityLink = entityLinkFn && log.entity_id ? entityLinkFn(log.entity_id) : null
                const details = log.details || {}
                const detailKeys = Object.keys(details)

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap text-xs text-gray-600">
                      {log.created_at ? formatDateTime(log.created_at) : '-'}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">
                        {log.user?.full_name || 'System'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {log.user?.email || ''}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-[#EEF2F9] text-[#1B3A6B] text-xs px-2 py-0.5 rounded-full">
                        {log.action?.replace(/_/g, ' ') || '-'}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600 capitalize">
                      {log.entity_type?.replace(/_/g, ' ') || '-'}
                    </td>
                    <td className="text-sm">
                      {entityLink ? (
                        <Link
                          href={entityLink}
                          className="text-[#0D7E8A] hover:underline font-mono text-xs"
                        >
                          {log.entity_id?.substring(0, 8)}...
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-gray-500">
                          {log.entity_id ? `${log.entity_id.substring(0, 8)}...` : '-'}
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs">
                      {detailKeys.length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-xs text-gray-500 hover:text-gray-700">
                            {detailKeys.length} field{detailKeys.length !== 1 ? 's' : ''}
                          </summary>
                          <pre className="mt-1 text-[10px] text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount || 0)} of {totalCount || 0}
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"
                >
                  <ChevronLeft size={16} />
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                return (
                  <Link
                    key={pageNum}
                    href={buildUrl({ page: String(pageNum) })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                      pageNum === page
                        ? 'bg-[#1B3A6B] text-white font-semibold'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-600"
                >
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
