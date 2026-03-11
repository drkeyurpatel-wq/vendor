import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { Plus, ClipboardList } from 'lucide-react'

const INDENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  converted_to_po: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
}

export default async function IndentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centre?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  let query = supabase
    .from('purchase_indents')
    .select('*, centre:centres(code, name), created_by_user:user_profiles!purchase_indents_created_by_fkey(full_name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.centre) query = query.eq('centre_id', params.centre)
  else if (profile?.centre_id && !['group_admin', 'group_cao'].includes(profile?.role || '')) {
    query = query.eq('centre_id', profile.centre_id)
  }

  const { data: indents, count } = await query.limit(50)
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  const STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'converted_to_po']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Indents</h1>
          <p className="page-subtitle">{count ?? 0} total indents</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <Link href="/purchase-orders/indents"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
            !params.status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/purchase-orders/indents?status=${s}`}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border capitalize transition-colors',
              params.status === s ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Centre filter for group roles */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && centres && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <Link href={`/purchase-orders/indents${params.status ? `?status=${params.status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              !params.centre ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
            All Centres
          </Link>
          {centres.map(c => (
            <Link key={c.id} href={`/purchase-orders/indents?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        {indents && indents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Indent Number</th>
                  <th>Centre</th>
                  <th>Priority</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {indents.map((indent: any) => (
                  <tr key={indent.id}>
                    <td><span className="font-mono text-xs font-semibold">{indent.indent_number}</span></td>
                    <td><span className="badge bg-blue-50 text-blue-700">{indent.centre?.code}</span></td>
                    <td>
                      <span className={cn('badge', PRIORITY_COLORS[indent.priority] || 'bg-gray-100 text-gray-700')}>
                        {indent.priority}
                      </span>
                    </td>
                    <td className="text-sm text-gray-700">{indent.created_by_user?.full_name || '—'}</td>
                    <td className="text-sm text-gray-600">{formatDate(indent.created_at)}</td>
                    <td>
                      <span className={cn('badge', INDENT_STATUS_COLORS[indent.status] || 'bg-gray-100 text-gray-700')}>
                        {indent.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {indent.status === 'approved' && (
                        <Link href={`/purchase-orders/new`} className="text-xs text-[#0D7E8A] hover:underline font-medium">
                          Convert to PO
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardList size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No purchase indents found</p>
            <p className="text-sm text-gray-400 mt-1">Indents are internal requests for procurement</p>
          </div>
        )}
      </div>
    </div>
  )
}
