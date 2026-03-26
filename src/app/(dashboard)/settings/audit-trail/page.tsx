import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { ArrowLeft, History, Search, Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ENTITY_LINKS: Record<string, string> = {
  purchase_order: '/purchase-orders',
  grn: '/grn',
  invoice: '/finance/invoices',
  vendor: '/vendors',
  item: '/items',
  purchase_indent: '/purchase-orders/indents',
}

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; entity_id?: string; page?: string }>
}) {
  const params = await searchParams
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !isGroupLevel) {
    return (
      <div className="card p-12 text-center">
        <History size={40} className="mx-auto mb-3 text-gray-500" />
        <p className="font-medium text-gray-500">Access Restricted — Group Admin / CAO only</p>
      </div>
    )
  }

  let query = supabase
    .from('audit_trail')
    .select('*, user:user_profiles!audit_trail_changed_by_fkey(full_name)', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .limit(100)

  if (params.entity_type) query = query.eq('entity_type', params.entity_type)
  if (params.entity_id) query = query.eq('entity_id', params.entity_id)

  // Try without FK first, fallback
  let trails: any[] = []
  let count = 0

  const { data, count: c, error } = await query
  if (error) {
    // FK might not exist — fetch without join
    const { data: d2, count: c2 } = await supabase
      .from('audit_trail')
      .select('*', { count: 'exact' })
      .order('changed_at', { ascending: false })
      .limit(100)
    trails = d2 || []
    count = c2 || 0
  } else {
    trails = data || []
    count = c || 0
  }

  // Get user names for display
  const userIds = Array.from(new Set(trails.map(t => t.changed_by).filter(Boolean)))
  const userNames: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('user_profiles').select('id, full_name').in('id', userIds)
    users?.forEach(u => { userNames[u.id] = u.full_name })
  }

  return (
    <div>
      <Link href="/settings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">{count} field-level changes tracked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/settings/audit-trail"
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !params.entity_type ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200')}>
          All
        </Link>
        {['purchase_order', 'grn', 'invoice', 'vendor', 'item'].map(et => (
          <Link key={et} href={`/settings/audit-trail?entity_type=${et}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              params.entity_type === et ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200')}>
            {et.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {trails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Entity</th>
                  <th>Field</th>
                  <th>Old Value</th>
                  <th>New Value</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                {trails.map((t: any) => {
                  const entityBase = ENTITY_LINKS[t.entity_type] || '#'
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="text-xs text-gray-500 whitespace-nowrap">{new Date(t.changed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        <Link href={`${entityBase}/${t.entity_id}`} className="text-xs font-mono text-teal-600 hover:underline">
                          {t.entity_type?.replace(/_/g, ' ')}
                        </Link>
                      </td>
                      <td className="text-sm font-medium text-gray-900">{t.field_name?.replace(/_/g, ' ')}</td>
                      <td className="text-sm text-red-600 font-mono bg-red-50/50 max-w-[200px] truncate">{t.old_value || '—'}</td>
                      <td className="text-sm text-green-700 font-mono bg-green-50/50 max-w-[200px] truncate">{t.new_value || '—'}</td>
                      <td className="text-sm text-gray-600">{userNames[t.changed_by] || t.user?.full_name || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <History size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No audit trail entries yet</p>
            <p className="text-sm text-gray-500 mt-1">Field-level changes will appear here as users modify POs, invoices, and other records</p>
          </div>
        )}
      </div>
    </div>
  )
}
