import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import InvoiceListClient from './InvoiceListClient'
import DateRangeFilter from '@/components/ui/DateRangeFilter'
import BatchMatchButton from '@/components/ui/BatchMatchButton'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ match_status?: string; payment_status?: string; centre?: string; q?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles').select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id).single()

  let query = supabase
    .from('invoices')
    .select('*, vendor:vendors(legal_name, vendor_code), centre:centres(code, name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.match_status) query = query.eq('match_status', params.match_status)
  if (params.payment_status) query = query.eq('payment_status', params.payment_status)
  if (params.centre) query = query.eq('centre_id', params.centre)
  if (params.q) query = query.or(`invoice_ref.ilike.%${params.q}%,vendor_invoice_no.ilike.%${params.q}%`)
  if (params.from) query = query.gte('vendor_invoice_date', params.from)
  if (params.to) query = query.lte('vendor_invoice_date', params.to)

  const { data: invoices, count } = await query.limit(200)
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  const MATCH_STATUSES = ['pending', 'matched', 'partial_match', 'mismatch']
  const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'disputed', 'on_hold']

  // Counts for filter badges
  const matchCounts: Record<string, number> = {}
  const paymentCounts: Record<string, number> = {}
  invoices?.forEach((inv: any) => {
    matchCounts[inv.match_status] = (matchCounts[inv.match_status] || 0) + 1
    paymentCounts[inv.payment_status] = (paymentCounts[inv.payment_status] || 0) + 1
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">{count ?? 0} total invoices</p>
        </div>
        <div className="flex gap-2">
          <BatchMatchButton />
          <Link href="/finance/invoices/new" className="btn-primary"><Plus size={16} /> New Invoice</Link>
        </div>
      </div>

      {/* Match status filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-wrap">
        <span className="text-xs text-gray-500 self-center mr-1 font-medium">Match:</span>
        <Link href="/finance/invoices"
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            !params.match_status ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {MATCH_STATUSES.map(s => (
          <Link key={s} href={`/finance/invoices?match_status=${s}${params.payment_status ? `&payment_status=${params.payment_status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all flex items-center gap-1.5',
              params.match_status === s ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
            {matchCounts[s] ? <span className={cn('text-[10px] px-1 rounded', params.match_status === s ? 'bg-white/20' : 'bg-gray-100')}>{matchCounts[s]}</span> : null}
          </Link>
        ))}
      </div>

      {/* Payment status filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <span className="text-xs text-gray-500 self-center mr-1 font-medium">Payment:</span>
        <Link href={`/finance/invoices${params.match_status ? `?match_status=${params.match_status}` : ''}`}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            !params.payment_status ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {PAYMENT_STATUSES.map(s => (
          <Link key={s} href={`/finance/invoices?payment_status=${s}${params.match_status ? `&match_status=${params.match_status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all flex items-center gap-1.5',
              params.payment_status === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
            {paymentCounts[s] ? <span className={cn('text-[10px] px-1 rounded', params.payment_status === s ? 'bg-white/20' : 'bg-gray-100')}>{paymentCounts[s]}</span> : null}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && centres && (
        <div className="mb-5 flex gap-2 flex-wrap">
          {centres.map(c => (
            <Link key={c.id} href={`/finance/invoices?centre=${c.id}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <InvoiceListClient invoices={invoices ?? []} userRole={profile?.role || 'store_staff'} />
    </div>
  )
}
