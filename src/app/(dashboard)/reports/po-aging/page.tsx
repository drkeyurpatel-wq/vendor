import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, formatLakhs, PO_STATUS_COLORS } from '@/lib/utils'
import { ArrowLeft, Clock, ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function POAgingReport({
  searchParams,
}: {
  searchParams: Promise<{ centre?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase
    .from('purchase_orders')
    .select('id, po_number, po_date, total_amount, status, expected_delivery_date, vendor:vendors(vendor_code, legal_name), centre:centres(code, name)')
    .in('status', ['pending_approval', 'approved', 'sent_to_vendor', 'partially_received'])
    .is('deleted_at', null)
    .order('po_date')

  if (params.centre) query = query.eq('centre_id', params.centre)

  const { data: pos } = await query
  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')

  const now = new Date()
  const enriched = (pos || []).map((po: any) => {
    const days = Math.floor((now.getTime() - new Date(po.po_date).getTime()) / 86400000)
    const bucket = days <= 7 ? '0-7d' : days <= 15 ? '8-15d' : days <= 30 ? '16-30d' : days <= 60 ? '31-60d' : '>60d'
    const bucketColor = days <= 7 ? 'bg-green-100 text-green-800' : days <= 15 ? 'bg-lime-100 text-lime-800' : days <= 30 ? 'bg-yellow-100 text-yellow-800' : days <= 60 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
    return { ...po, ageDays: days, bucket, bucketColor }
  })

  const totalValue = enriched.reduce((s, p) => s + (p.total_amount || 0), 0)
  const bucketCounts: Record<string, { count: number; value: number }> = {}
  enriched.forEach(p => {
    if (!bucketCounts[p.bucket]) bucketCounts[p.bucket] = { count: 0, value: 0 }
    bucketCounts[p.bucket].count++
    bucketCounts[p.bucket].value += p.total_amount || 0
  })

  return (
    <div>
      <Link href="/reports" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">PO Aging Report</h1>
          <p className="text-sm text-gray-500 mt-1">{enriched.length} open POs — {formatLakhs(totalValue)} total value</p>
        </div>
      </div>

      {/* Centre filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/reports/po-aging" className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', !params.centre ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>All Centres</Link>
        {centres?.map(c => (
          <Link key={c.id} href={`/reports/po-aging?centre=${c.id}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', params.centre === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>{c.code}</Link>
        ))}
      </div>

      {/* Aging buckets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {['0-7d', '8-15d', '16-30d', '31-60d', '>60d'].map(b => {
          const d = bucketCounts[b] || { count: 0, value: 0 }
          return (
            <div key={b} className={cn('rounded-xl border shadow-card p-4', b === '>60d' || b === '31-60d' ? 'border-red-200 bg-red-50/30' : 'border-gray-200/80 bg-white')}>
              <div className="text-xs text-gray-500">{b}</div>
              <div className="text-lg font-bold text-gray-900">{d.count} POs</div>
              <div className="text-xs text-gray-500">{formatLakhs(d.value)}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {enriched.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>PO #</th><th>Vendor</th><th>Centre</th><th>PO Date</th><th>Age</th><th className="text-right">Value</th><th>Status</th><th>Aging</th></tr></thead>
              <tbody>
                {enriched.map(po => (
                  <tr key={po.id}>
                    <td><Link href={`/purchase-orders/${po.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{po.po_number}</Link></td>
                    <td><div className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{po.vendor?.legal_name}</div></td>
                    <td><span className="badge bg-blue-50 text-blue-700">{po.centre?.code}</span></td>
                    <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                    <td className={cn('text-sm font-semibold', po.ageDays > 30 ? 'text-red-600' : po.ageDays > 15 ? 'text-orange-600' : 'text-gray-700')}>{po.ageDays}d</td>
                    <td className="text-sm text-right font-semibold">{formatCurrency(po.total_amount)}</td>
                    <td><span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>{po.status.replace(/_/g, ' ')}</span></td>
                    <td><span className={cn('badge', po.bucketColor)}>{po.bucket}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><ShoppingCart size={40} className="mb-3 text-gray-300" /><p className="font-medium text-gray-500">No open POs</p></div>
        )}
      </div>
    </div>
  )
}
