import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { FileText, Plus } from 'lucide-react'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 50

const DN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800',
  adjusted: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const DN_REASON_COLORS: Record<string, string> = {
  goods_return: 'bg-orange-100 text-orange-800',
  rate_difference: 'bg-blue-100 text-blue-800',
  quality_issue: 'bg-red-100 text-red-800',
  shortage: 'bg-yellow-100 text-yellow-800',
  damaged: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-700',
}

const STATUSES = ['draft', 'approved', 'sent', 'adjusted', 'cancelled']

export default async function DebitNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centre?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))
  const { supabase, role, centreId, isGroupLevel } = await requireAuth()

  // Main query
  let query = supabase
    .from('debit_notes')
    .select('*, vendor:vendors(legal_name), centre:centres(code, name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.centre) query = query.eq('centre_id', params.centre)
  if (params.q) query = query.or(`dn_number.ilike.%${params.q}%,vendor:vendors.legal_name.ilike.%${params.q}%`)

  // RLS handles centre scoping, but apply explicit filter if passed
  if (centreId && !isGroupLevel) {
    query = query.eq('centre_id', centreId)
  }

  const from = (currentPage - 1) * PAGE_SIZE
  const { data: debitNotes, count } = await query.range(from, from + PAGE_SIZE - 1)

  // Summary stats
  const { count: totalCount } = await supabase
    .from('debit_notes')
    .select('*', { count: 'exact', head: true })

  const { data: totalAmountData } = await supabase
    .from('debit_notes')
    .select('amount')

  const totalAmount = totalAmountData?.reduce((sum: number, dn: any) => sum + (dn.amount || 0), 0) ?? 0

  const { count: pendingCount } = await supabase
    .from('debit_notes')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'approved', 'sent'])

  // Centres for filter
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Debit Notes</h1>
          <p className="page-subtitle">{count ?? 0} total debit notes</p>
        </div>
        <Link href="/finance/debit-notes/new" className="btn-primary">
          <Plus size={16} /> New Debit Note
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Debit Notes</p>
          <p className="text-2xl font-bold" style={{ color: '#1B3A6B' }}>{totalCount ?? 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold" style={{ color: '#0D7E8A' }}>{formatLakhs(totalAmount)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Pending Adjustment</p>
          <p className="text-2xl font-bold text-orange-600">{pendingCount ?? 0}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput placeholder="Search DN number or vendor name..." />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <Link href="/finance/debit-notes"
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !params.status ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/finance/debit-notes?status=${s}${params.centre ? `&centre=${params.centre}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors',
              params.status === s ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      {isGroupLevel && centres && (
        <div className="mb-5 flex gap-2 flex-wrap">
          {centres.map(c => (
            <Link key={c.id} href={`/finance/debit-notes?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {debitNotes && debitNotes.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DN Number</th>
                  <th>Vendor</th>
                  <th>Centre</th>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {debitNotes.map((dn: any) => (
                  <tr key={dn.id}>
                    <td>
                      <Link href={`/finance/debit-notes/${dn.id}`} className="font-mono text-xs font-semibold hover:text-teal-500 transition-colors">
                        {dn.dn_number}
                      </Link>
                    </td>
                    <td className="text-sm font-medium text-gray-900">{dn.vendor?.legal_name}</td>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700">{dn.centre?.code}</span>
                    </td>
                    <td className="text-sm text-gray-600">{formatDate(dn.created_at)}</td>
                    <td>
                      <span className={cn('badge', DN_REASON_COLORS[dn.reason] || DN_REASON_COLORS.other)}>
                        {dn.reason?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-sm font-semibold">{formatLakhs(dn.amount)}</td>
                    <td>
                      <span className={cn('badge', DN_STATUS_COLORS[dn.status] || DN_STATUS_COLORS.draft)}>
                        {dn.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <Link href={`/finance/debit-notes/${dn.id}`}
                        className="text-xs font-medium hover:underline" style={{ color: '#0D7E8A' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </>
        ) : (
          <div className="empty-state">
            <FileText size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No debit notes found</p>
            <p className="text-sm text-gray-500 mt-1">Create a debit note to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
