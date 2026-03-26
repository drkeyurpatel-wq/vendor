import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Calendar, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import PaymentScheduleActions from '@/components/ui/PaymentScheduleActions'

export const dynamic = 'force-dynamic'

export default async function PaymentSchedulePage() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const weekEnd = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]
  const fortnight = new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0]
  const monthEnd = new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0]

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, total_amount, paid_amount, tds_amount, due_date, payment_status, match_status, vendor:vendors(id, legal_name, vendor_code, bank_name), centre:centres(code)')
    .in('payment_status', ['unpaid', 'partial'])
    .is('deleted_at', null)
    .order('due_date')

  const all = (invoices || []).map((inv: any) => ({
    ...inv,
    outstanding: (inv.total_amount || 0) - (inv.paid_amount || 0) - (inv.tds_amount || 0),
    isOverdue: inv.due_date && inv.due_date < todayStr,
    isDueThisWeek: inv.due_date && inv.due_date >= todayStr && inv.due_date <= weekEnd,
    isDueNextWeek: inv.due_date && inv.due_date > weekEnd && inv.due_date <= fortnight,
    isDueThisMonth: inv.due_date && inv.due_date > fortnight && inv.due_date <= monthEnd,
  }))

  const overdue = all.filter(i => i.isOverdue)
  const thisWeek = all.filter(i => i.isDueThisWeek)
  const nextWeek = all.filter(i => i.isDueNextWeek)
  const thisMonth = all.filter(i => i.isDueThisMonth)
  const later = all.filter(i => !i.isOverdue && !i.isDueThisWeek && !i.isDueNextWeek && !i.isDueThisMonth)

  const buckets = [
    { label: 'Overdue', items: overdue, color: 'border-red-500 bg-red-50', textColor: 'text-red-700', icon: AlertTriangle },
    { label: 'Due This Week', items: thisWeek, color: 'border-orange-500 bg-orange-50', textColor: 'text-orange-700', icon: Clock },
    { label: 'Due Next Week', items: nextWeek, color: 'border-yellow-500 bg-yellow-50', textColor: 'text-yellow-700', icon: Calendar },
    { label: 'Due This Month', items: thisMonth, color: 'border-blue-500 bg-blue-50', textColor: 'text-blue-700', icon: Calendar },
    { label: 'Later', items: later, color: 'border-gray-300 bg-gray-50', textColor: 'text-gray-600', icon: CheckCircle2 },
  ]

  const totalOutstanding = all.reduce((s, i) => s + i.outstanding, 0)

  function renderBucket(bucket: typeof buckets[0]) {
    if (bucket.items.length === 0) return null
    const Icon = bucket.icon
    const bucketTotal = bucket.items.reduce((s, i) => s + i.outstanding, 0)
    return (
      <div key={bucket.label} className={cn('card overflow-hidden border-l-4 mb-6', bucket.color)}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={16} className={bucket.textColor} />
            <h2 className={cn('font-semibold text-sm', bucket.textColor)}>{bucket.label} ({bucket.items.length})</h2>
          </div>
          <span className={cn('font-bold text-sm', bucket.textColor)}>{formatCurrency(bucketTotal)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr>
              <th>Invoice</th><th>Vendor</th><th>Centre</th><th>Due Date</th><th>Match</th><th className="text-right">Outstanding</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {bucket.items.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td>
                    <Link href={`/finance/invoices/${inv.id}`} className="font-mono text-xs text-teal-600 hover:underline font-semibold">{inv.invoice_ref}</Link>
                    {inv.vendor_invoice_no && <div className="text-[10px] text-gray-500">{inv.vendor_invoice_no}</div>}
                  </td>
                  <td>
                    <Link href={`/vendors/${inv.vendor?.id}`} className="text-sm text-gray-900 hover:text-teal-600">{inv.vendor?.legal_name}</Link>
                    {inv.vendor?.bank_name && <div className="text-[10px] text-gray-500">{inv.vendor.bank_name}</div>}
                  </td>
                  <td><span className="badge bg-blue-50 text-blue-700 text-xs">{inv.centre?.code}</span></td>
                  <td className={cn('text-xs font-medium', inv.isOverdue ? 'text-red-600' : 'text-gray-600')}>{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                  <td><span className={cn('badge text-[10px]', inv.match_status === 'matched' ? 'bg-green-100 text-green-700' : inv.match_status === 'mismatch' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>{inv.match_status || 'pending'}</span></td>
                  <td className="text-sm text-right font-semibold">{formatCurrency(inv.outstanding)}</td>
                  <td className="px-3 py-2">
                    <PaymentScheduleActions
                      payment={{
                        id: inv.id,
                        vendor_invoice_no: inv.vendor_invoice_no || inv.invoice_ref || '—',
                        total_amount: inv.outstanding,
                        due_date: inv.due_date,
                        payment_status: inv.payment_status,
                        vendor_name: inv.vendor?.legal_name,
                        vendor_id: inv.vendor_id || inv.vendor?.id,
                      }}
                      userRole={role}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link href="/finance/payments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back to Payments</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Schedule</h1>
          <p className="page-subtitle">{all.length} unpaid invoices — {formatCurrency(totalOutstanding)} total outstanding</p>
        </div>
        <Link href="/finance/payments/new" className="btn-primary text-sm">Create Payment Batch</Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {buckets.map(b => (
          <div key={b.label} className={cn('stat-card border-l-4', b.color)}>
            <div className={cn('text-xs', b.textColor)}>{b.label}</div>
            <div className={cn('text-lg font-bold', b.textColor)}>{b.items.length}</div>
            <div className="text-xs text-gray-500">{formatCurrency(b.items.reduce((s, i) => s + i.outstanding, 0))}</div>
          </div>
        ))}
      </div>

      {buckets.map(renderBucket)}
    </div>
  )
}
