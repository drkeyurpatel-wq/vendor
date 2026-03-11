import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate, formatLakhs, MATCH_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { FileText } from 'lucide-react'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ match_status?: string; payment_status?: string; centre?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  let query = supabase
    .from('invoices')
    .select('*, vendor:vendors(legal_name), centre:centres(code, name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params.match_status) query = query.eq('match_status', params.match_status)
  if (params.payment_status) query = query.eq('payment_status', params.payment_status)
  if (params.centre) query = query.eq('centre_id', params.centre)

  const { data: invoices, count } = await query.limit(50)
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  const MATCH_STATUSES = ['pending', 'matched', 'partial_match', 'mismatch']
  const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'disputed', 'on_hold']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{count ?? 0} total invoices</p>
        </div>
      </div>

      {/* Match status filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-wrap">
        <span className="text-xs text-gray-500 self-center mr-1">Match:</span>
        <Link href="/finance/invoices"
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !params.match_status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200')}>
          All
        </Link>
        {MATCH_STATUSES.map(s => (
          <Link key={s} href={`/finance/invoices?match_status=${s}${params.payment_status ? `&payment_status=${params.payment_status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors',
              params.match_status === s ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Payment status filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <span className="text-xs text-gray-500 self-center mr-1">Payment:</span>
        <Link href={`/finance/invoices${params.match_status ? `?match_status=${params.match_status}` : ''}`}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !params.payment_status ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-600 border-gray-200')}>
          All
        </Link>
        {PAYMENT_STATUSES.map(s => (
          <Link key={s} href={`/finance/invoices?payment_status=${s}${params.match_status ? `&match_status=${params.match_status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors',
              params.payment_status === s ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-600 border-gray-200')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && centres && (
        <div className="mb-5 flex gap-2 flex-wrap">
          {centres.map(c => (
            <Link key={c.id} href={`/finance/invoices?centre=${c.id}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        {invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Vendor Invoice</th>
                  <th>Centre</th>
                  <th>Vendor</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Match</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td><span className="font-mono text-xs font-semibold">{inv.invoice_ref}</span></td>
                    <td className="font-mono text-xs text-gray-600">{inv.vendor_invoice_no}</td>
                    <td><span className="badge bg-blue-50 text-blue-700">{inv.centre?.code}</span></td>
                    <td className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</td>
                    <td className="text-sm text-gray-600">{formatDate(inv.vendor_invoice_date)}</td>
                    <td className="text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                    <td className="text-sm font-semibold">{formatLakhs(inv.total_amount)}</td>
                    <td>
                      <span className={cn('badge', MATCH_STATUS_COLORS[inv.match_status as keyof typeof MATCH_STATUS_COLORS])}>
                        {inv.match_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                        {inv.payment_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  )
}
