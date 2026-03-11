import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { Wallet, Calendar } from 'lucide-react'

const BATCH_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('payment_batches')
    .select('*', { count: 'exact' })
    .order('batch_date', { ascending: false })

  if (params.status) query = query.eq('status', params.status)

  const { data: batches, count } = await query.limit(50)

  // Get summary stats
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('total_amount, paid_amount')
    .in('payment_status', ['unpaid', 'partial'])

  const totalOutstanding = pendingInvoices?.reduce((s, i: any) => s + (i.total_amount - (i.paid_amount || 0)), 0) ?? 0
  const unpaidCount = pendingInvoices?.length ?? 0

  const STATUSES = ['draft', 'pending_approval', 'approved', 'processing', 'completed']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Batches</h1>
          <p className="page-subtitle">{count ?? 0} batches | Saturday payment cycle</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-gray-700">Total Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(totalOutstanding)}</div>
          <div className="text-sm text-gray-500 mt-1">{unpaidCount} unpaid invoices</div>
        </div>
        <div className="stat-card border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Total Batches</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{count ?? 0}</div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Completed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {batches?.filter((b: any) => b.status === 'completed').length ?? 0}
          </div>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/finance/payments"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
            !params.status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/finance/payments?status=${s}`}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium border capitalize transition-colors',
              params.status === s ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {batches && batches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Batch Number</th>
                  <th>Batch Date</th>
                  <th>Total Amount</th>
                  <th>Payment Count</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch: any) => (
                  <tr key={batch.id}>
                    <td><span className="font-mono text-xs font-semibold">{batch.batch_number}</span></td>
                    <td className="text-sm font-medium">{formatDate(batch.batch_date)}</td>
                    <td className="text-sm font-semibold">{formatLakhs(batch.total_amount || 0)}</td>
                    <td className="text-sm text-gray-600">{batch.payment_count || 0}</td>
                    <td>
                      <span className={cn('badge', BATCH_STATUS_COLORS[batch.status] || 'bg-gray-100 text-gray-700')}>
                        {batch.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">{formatDate(batch.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Wallet size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No payment batches found</p>
            <p className="text-sm text-gray-400 mt-1">Payment batches are created on Saturdays</p>
          </div>
        )}
      </div>
    </div>
  )
}
