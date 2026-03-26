import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, formatLakhs } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, Download, Mail, MessageCircle } from 'lucide-react'

function agingBucket(days: number) {
  if (days <= 0) return { label: 'Current', color: 'bg-green-100 text-green-800', priority: 0 }
  if (days <= 30) return { label: '1-30d', color: 'bg-lime-100 text-lime-800', priority: 1 }
  if (days <= 60) return { label: '31-60d', color: 'bg-yellow-100 text-yellow-800', priority: 2 }
  if (days <= 90) return { label: '61-90d', color: 'bg-orange-100 text-orange-800', priority: 3 }
  return { label: '>90d', color: 'bg-red-100 text-red-800', priority: 4 }
}

export const dynamic = 'force-dynamic'

export default async function VendorOverdueReport() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, total_amount, paid_amount, due_date, payment_status, credit_period_days, vendor_invoice_date, vendor:vendors(id, vendor_code, legal_name, primary_contact_email, primary_contact_phone), centre:centres(code)')
    .in('payment_status', ['unpaid', 'partial'])
    .order('due_date')

  const now = new Date()
  const enriched = (invoices || []).map((inv: any) => {
    const dueDate = new Date(inv.due_date)
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / 86400000)
    const outstanding = (inv.total_amount || 0) - (inv.paid_amount || 0)
    return { ...inv, daysOverdue, outstanding, bucket: agingBucket(daysOverdue) }
  })

  // Group by vendor
  const vendorMap = new Map<string, { vendor: any; invoices: any[]; totalOutstanding: number; worstBucket: number }>()
  enriched.forEach(inv => {
    const vid = inv.vendor?.id || 'unknown'
    if (!vendorMap.has(vid)) vendorMap.set(vid, { vendor: inv.vendor, invoices: [], totalOutstanding: 0, worstBucket: 0 })
    const g = vendorMap.get(vid)!
    g.invoices.push(inv)
    g.totalOutstanding += inv.outstanding
    g.worstBucket = Math.max(g.worstBucket, inv.bucket.priority)
  })

  const vendorGroups = Array.from(vendorMap.values()).sort((a, b) => b.worstBucket - a.worstBucket || b.totalOutstanding - a.totalOutstanding)
  const totalOutstanding = enriched.reduce((s, i) => s + i.outstanding, 0)
  const overdueCount = enriched.filter(i => i.daysOverdue > 0).length
  const bucketTotals = [0, 0, 0, 0, 0]
  enriched.forEach(i => { bucketTotals[i.bucket.priority] += i.outstanding })

  return (
    <div>
      <Link href="/reports" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Vendor Overdue Report</h1>
          <p className="text-sm text-gray-500 mt-1">{enriched.length} unpaid invoices across {vendorMap.size} vendors</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500">Total Outstanding</div>
          <div className="text-xl font-bold text-red-600">{formatLakhs(totalOutstanding)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500">Overdue Invoices</div>
          <div className="text-xl font-bold text-orange-600">{overdueCount}</div>
        </div>
        {['Current', '1-30d', '31-60d', '61-90d', '>90d'].map((label, i) => (
          <div key={label} className={cn('rounded-xl border shadow-card p-4', i >= 3 ? 'border-red-200 bg-red-50/30' : 'border-gray-200/80 bg-white')}>
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-bold text-gray-900">{formatLakhs(bucketTotals[i])}</div>
          </div>
        ))}
      </div>

      {/* Aging bar */}
      {totalOutstanding > 0 && (
        <div className="card p-4 mb-6">
          <div className="text-xs font-medium text-gray-700 mb-2">Aging Distribution</div>
          <div className="flex h-7 rounded-lg overflow-hidden">
            {[
              { amt: bucketTotals[0], color: 'bg-green-500', label: 'Current' },
              { amt: bucketTotals[1], color: 'bg-lime-500', label: '1-30d' },
              { amt: bucketTotals[2], color: 'bg-yellow-500', label: '31-60d' },
              { amt: bucketTotals[3], color: 'bg-orange-500', label: '61-90d' },
              { amt: bucketTotals[4], color: 'bg-red-500', label: '>90d' },
            ].filter(b => b.amt > 0).map(b => (
              <div key={b.label} className={cn(b.color, 'flex items-center justify-center text-white text-[10px] font-medium')}
                style={{ width: `${(b.amt / totalOutstanding) * 100}%` }}>
                {Math.round((b.amt / totalOutstanding) * 100)}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendor-wise breakdown */}
      {vendorGroups.map(group => (
        <div key={group.vendor?.id || 'x'} className="card overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <Link href={`/vendors/${group.vendor?.id}`} className="text-sm font-semibold text-navy-600 hover:underline">{group.vendor?.legal_name}</Link>
              <span className="ml-2 font-mono text-xs text-gray-500">{group.vendor?.vendor_code}</span>
              <span className="ml-3 text-sm font-bold text-red-600">{formatLakhs(group.totalOutstanding)} outstanding</span>
            </div>
            <div className="flex gap-2">
              {group.vendor?.primary_contact_email && (
                <a href={`mailto:${group.vendor.primary_contact_email}?subject=Outstanding Payment Reminder - Health1 Hospitals&body=Dear ${group.vendor.legal_name},%0D%0A%0D%0AThis is a reminder regarding outstanding invoices totalling ${formatCurrency(group.totalOutstanding)}.%0D%0APlease arrange for clearance at the earliest.`}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"><Mail size={10} /> Email</a>
              )}
              {group.vendor?.primary_contact_phone && (
                <a href={`https://wa.me/${group.vendor.primary_contact_phone.replace(/\D/g, '')}?text=Payment reminder from Health1 Hospitals: Outstanding amount ${formatCurrency(group.totalOutstanding)}. Please arrange clearance.`}
                  target="_blank" className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center gap-1"><MessageCircle size={10} /> WhatsApp</a>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Centre</th><th>Invoice Date</th><th>Due Date</th><th className="text-right">Amount</th><th className="text-right">Paid</th><th className="text-right">Outstanding</th><th>Days</th><th>Aging</th></tr></thead>
              <tbody>
                {group.invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td><Link href={`/finance/invoices/${inv.id}`} className="font-mono text-xs text-teal-600 hover:underline">{inv.invoice_ref}</Link></td>
                    <td><span className="badge bg-blue-50 text-blue-700">{inv.centre?.code}</span></td>
                    <td className="text-sm text-gray-600">{inv.vendor_invoice_date ? formatDate(inv.vendor_invoice_date) : '—'}</td>
                    <td className={cn('text-sm', inv.daysOverdue > 0 ? 'text-red-600 font-medium' : 'text-gray-600')}>{formatDate(inv.due_date)}</td>
                    <td className="text-sm text-right">{formatCurrency(inv.total_amount)}</td>
                    <td className="text-sm text-right text-green-600">{formatCurrency(inv.paid_amount || 0)}</td>
                    <td className="text-sm text-right font-semibold text-red-600">{formatCurrency(inv.outstanding)}</td>
                    <td className={cn('text-sm font-medium text-center', inv.daysOverdue > 0 ? 'text-red-600' : 'text-green-600')}>
                      {inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : `${Math.abs(inv.daysOverdue)}d left`}
                    </td>
                    <td><span className={cn('badge', inv.bucket.color)}>{inv.bucket.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {vendorGroups.length === 0 && (
        <div className="card p-12 text-center">
          <AlertTriangle size={40} className="mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-700">No outstanding invoices</p>
          <p className="text-sm text-gray-500 mt-1">All vendor payments are current</p>
        </div>
      )}
    </div>
  )
}
