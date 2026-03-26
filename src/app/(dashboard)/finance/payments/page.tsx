import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn, formatLakhs } from '@/lib/utils'
import { Plus, Wallet, AlertTriangle, Calendar } from 'lucide-react'
import PaymentListClient from './PaymentListClient'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const { supabase, role } = await requireAuth()

  let query = supabase
    .from('payment_batches')
    .select('*', { count: 'exact' })
    .order('batch_date', { ascending: false })

  if (params.status) query = query.eq('status', params.status)

  const { data: batches, count } = await query.limit(200)

  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('total_amount, paid_amount')
    .in('payment_status', ['unpaid', 'partial'])

  const totalOutstanding = pendingInvoices?.reduce((s, i: any) => s + (i.total_amount - (i.paid_amount || 0)), 0) ?? 0
  const unpaidCount = pendingInvoices?.length ?? 0

  // Next Saturday
  const now = new Date()
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7
  const nextSaturday = new Date(now.getTime() + daysUntilSat * 24 * 60 * 60 * 1000)
  const nextSatStr = nextSaturday.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

  const STATUSES = ['draft', 'pending_approval', 'approved', 'processing', 'completed']

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Payment Batches</h1>
          <p className="text-sm text-gray-500 mt-1">{count ?? 0} batches — Saturday payment cycle</p>
        </div>
        <Link href="/finance/payments/new" className="btn-primary"><Plus size={16} /> New Batch</Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-gray-700">Total Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(totalOutstanding)}</div>
          <div className="text-xs text-gray-400 mt-1">{unpaidCount} unpaid invoices</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-amber-500" />
            <span className="text-sm font-semibold text-gray-700">Next Payment Day</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{nextSatStr}</div>
          <div className="text-xs text-gray-400 mt-1">Saturday payment cycle</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Batches This Month</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {batches?.filter((b: any) => new Date(b.batch_date).getMonth() === now.getMonth()).length ?? 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatLakhs(batches?.filter((b: any) => new Date(b.batch_date).getMonth() === now.getMonth() && b.status === 'completed').reduce((s: number, b: any) => s + (b.total_amount || 0), 0) ?? 0)} processed
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap" role="tablist">
        <Link href="/finance/payments" role="tab" aria-selected={!params.status}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all',
            !params.status ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/finance/payments?status=${s}`} role="tab" aria-selected={params.status === s}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border capitalize transition-all',
              params.status === s ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <PaymentListClient batches={batches ?? []} userRole={role} />
    </div>
  )
}
