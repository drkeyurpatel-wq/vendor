import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { FileQuestion, Plus, Clock, AlertTriangle } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { isDeadlinePassed } from '@/lib/rfq'

export const dynamic = 'force-dynamic'

const RFQ_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-green-100 text-green-700',
  evaluation: 'bg-blue-100 text-blue-700',
  awarded: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'awarded', label: 'Awarded' },
  { key: 'draft', label: 'Draft' },
]

export default async function RFQListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { supabase } = await requireAuth()
  const params = await searchParams
  const status = params.status || 'all'

  let query = supabase
    .from('rfqs')
    .select(
      'id, rfq_number, title, status, submission_deadline, delivery_required_by, created_at, ' +
      'centre:centres(code), items:rfq_items(id), quotes:rfq_quotes(id, status, total_amount), ' +
      'awarded_vendor:vendors!rfqs_awarded_vendor_id_fkey(legal_name)'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)

  const { data: rfqs } = await query

  const rows = (rfqs ?? []) as any[]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Request for Quotation</h1>
          <p className="page-subtitle">
            Invite vendors to quote, compare what comes back, and award the work
          </p>
        </div>
        <Link href="/purchase-orders/rfqs/new" className="btn-primary text-sm cursor-pointer">
          <Plus size={14} /> New RFQ
        </Link>
      </div>

      <nav className="flex gap-2 mb-5 flex-wrap" aria-label="Filter by status">
        {FILTERS.map(f => (
          <Link
            key={f.key}
            href={f.key === 'all' ? '/purchase-orders/rfqs' : `/purchase-orders/rfqs?status=${f.key}`}
            aria-current={status === f.key ? 'page' : undefined}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
              status === f.key
                ? 'bg-navy-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileQuestion size={44} strokeWidth={1.2} />}
            title={status === 'all' ? 'No RFQs raised yet' : `No ${status} RFQs`}
            description={
              status === 'all'
                ? 'Raise an RFQ to ask several vendors for a price on the same list of items, then compare their quotes side by side.'
                : 'Try a different status filter, or raise a new RFQ.'
            }
            action={
              <Link href="/purchase-orders/rfqs/new" className="btn-primary text-sm cursor-pointer">
                <Plus size={14} /> New RFQ
              </Link>
            }
          />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="data-table w-full">
            <caption className="sr-only">
              Requests for quotation, most recently created first
            </caption>
            <thead>
              <tr>
                <th scope="col">RFQ</th>
                <th scope="col">Title</th>
                <th scope="col">Centre</th>
                <th scope="col">Items</th>
                <th scope="col">Quotes</th>
                <th scope="col">Deadline</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(rfq => {
                const submitted = (rfq.quotes ?? []).filter(
                  (q: any) => q.status && q.status !== 'draft'
                )
                const closing = rfq.status === 'open' && isDeadlinePassed(rfq.submission_deadline)
                const best = submitted
                  .map((q: any) => q.total_amount)
                  .filter((t: any) => typeof t === 'number' && t > 0)
                  .sort((a: number, b: number) => a - b)[0]

                return (
                  <tr key={rfq.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td>
                      <Link
                        href={`/purchase-orders/rfqs/${rfq.id}`}
                        className="text-sm font-medium text-navy-600 hover:underline cursor-pointer"
                      >
                        {rfq.rfq_number}
                      </Link>
                    </td>
                    <td className="text-sm text-gray-900 max-w-[280px] truncate">{rfq.title}</td>
                    <td className="text-sm text-gray-600">{rfq.centre?.code ?? '—'}</td>
                    <td className="text-sm text-gray-600">{(rfq.items ?? []).length}</td>
                    <td className="text-sm text-gray-600">
                      {submitted.length}
                      {best !== undefined && (
                        <span className="text-xs text-gray-500 ml-1.5">
                          from {formatCurrency(best)}
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(rfq.submission_deadline)}
                      {closing && (
                        <span className="inline-flex items-center gap-1 ml-2 text-xs text-amber-700">
                          <Clock size={12} aria-hidden="true" /> passed
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={cn('badge text-xs', RFQ_STATUS_COLORS[rfq.status] ?? 'bg-gray-100 text-gray-700')}>
                        {rfq.status.replace(/_/g, ' ')}
                      </span>
                      {rfq.status === 'awarded' && rfq.awarded_vendor?.legal_name && (
                        <div className="text-xs text-gray-500 mt-0.5 max-w-[160px] truncate">
                          {rfq.awarded_vendor.legal_name}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.some((r: any) => r.status === 'open' && isDeadlinePassed(r.submission_deadline)) && (
        <p className="flex items-start gap-2 text-sm text-gray-600 mt-4">
          <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
          Some open RFQs are past their submission deadline. Open them to compare the quotes received and award, or close them.
        </p>
      )}
    </div>
  )
}
