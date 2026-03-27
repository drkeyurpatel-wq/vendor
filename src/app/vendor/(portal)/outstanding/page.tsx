import { requireVendorAuth } from '@/lib/vendor-auth'
import { cn, formatDate, formatCurrency, getDueDateStatus } from '@/lib/utils'
import { AlertTriangle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VendorOutstandingPage() {
  const { supabase, vendorId } = await requireVendorAuth()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, tds_amount, due_date, payment_status, status, credit_period_days, centre:centres(code), po:purchase_orders(po_number)')
    .eq('vendor_id', vendorId)
    .in('payment_status', ['unpaid', 'partial', 'on_hold'])
    .order('due_date', { ascending: true })

  const outstandingInvoices = (invoices || []).map((inv: any) => {
    const outstanding = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)
    const dueStatus = inv.due_date ? getDueDateStatus(inv.due_date) : 'ok'
    const daysOverdue = inv.due_date ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
    return { ...inv, outstanding, dueStatus, daysOverdue }
  })

  const totalOutstanding = outstandingInvoices.reduce((s, i) => s + i.outstanding, 0)
  const overdue = outstandingInvoices.filter(i => i.dueStatus === 'overdue')
  const critical = outstandingInvoices.filter(i => i.dueStatus === 'critical')
  const upcoming = outstandingInvoices.filter(i => ['warning', 'ok'].includes(i.dueStatus))

  const overdueAmount = overdue.reduce((s, i) => s + i.outstanding, 0)

  // Aging buckets
  const aging = {
    current: outstandingInvoices.filter(i => i.daysOverdue <= 0).reduce((s, i) => s + i.outstanding, 0),
    '1_30': outstandingInvoices.filter(i => i.daysOverdue > 0 && i.daysOverdue <= 30).reduce((s, i) => s + i.outstanding, 0),
    '31_60': outstandingInvoices.filter(i => i.daysOverdue > 30 && i.daysOverdue <= 60).reduce((s, i) => s + i.outstanding, 0),
    '61_90': outstandingInvoices.filter(i => i.daysOverdue > 60 && i.daysOverdue <= 90).reduce((s, i) => s + i.outstanding, 0),
    '90_plus': outstandingInvoices.filter(i => i.daysOverdue > 90).reduce((s, i) => s + i.outstanding, 0),
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outstanding</h1>
        <p className="text-sm text-gray-500 mt-0.5">Unpaid invoices and aging analysis</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Total Outstanding</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{formatCurrency(totalOutstanding)}</div>
          <div className="text-xs text-gray-500 mt-1">{outstandingInvoices.length} invoices</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="text-xs text-red-600 mb-1">Overdue</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
          <div className="text-xs text-red-500 mt-1">{overdue.length} invoices</div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <div className="text-xs text-orange-600 mb-1">Due in 3 days</div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(critical.reduce((s, i) => s + i.outstanding, 0))}</div>
          <div className="text-xs text-orange-500 mt-1">{critical.length} invoices</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Upcoming</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(upcoming.reduce((s, i) => s + i.outstanding, 0))}</div>
          <div className="text-xs text-gray-500 mt-1">{upcoming.length} invoices</div>
        </div>
      </div>

      {/* Aging Bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Aging Analysis</h2>
        <div className="space-y-2">
          {[
            { label: 'Current (not due)', value: aging.current, color: 'bg-green-500' },
            { label: '1–30 days overdue', value: aging['1_30'], color: 'bg-yellow-500' },
            { label: '31–60 days overdue', value: aging['31_60'], color: 'bg-orange-500' },
            { label: '61–90 days overdue', value: aging['61_90'], color: 'bg-red-500' },
            { label: '90+ days overdue', value: aging['90_plus'], color: 'bg-red-700' },
          ].map((bucket) => {
            const pct = totalOutstanding > 0 ? (bucket.value / totalOutstanding) * 100 : 0
            return (
              <div key={bucket.label} className="flex items-center gap-3">
                <div className="w-36 text-xs text-gray-600">{bucket.label}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div className={cn('h-full rounded-lg transition-all', bucket.color)} style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
                </div>
                <div className="w-24 text-xs font-semibold text-right">{formatCurrency(bucket.value)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {outstandingInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PO</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Centre</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold">{inv.invoice_ref}</div>
                      <div className="text-[11px] text-gray-500">{inv.vendor_invoice_no}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{inv.po?.po_number || '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{inv.centre?.code}</span></td>
                    <td className="px-4 py-3 text-xs text-right">{formatCurrency(inv.total_amount)}</td>
                    <td className="px-4 py-3 text-xs text-right font-bold text-[#1B3A6B]">{formatCurrency(inv.outstanding)}</td>
                    <td className="px-4 py-3 text-xs">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                        inv.dueStatus === 'overdue' ? 'bg-red-100 text-red-700' :
                        inv.dueStatus === 'critical' ? 'bg-orange-100 text-orange-700' :
                        inv.dueStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {inv.dueStatus === 'overdue' ? `${inv.daysOverdue}d overdue` :
                         inv.dueStatus === 'critical' ? 'Due soon' :
                         inv.dueStatus === 'warning' ? 'Due this week' : 'Upcoming'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Clock size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-500">No outstanding invoices</p>
            <p className="text-sm text-gray-400 mt-1">All invoices are paid</p>
          </div>
        )}
      </div>
    </div>
  )
}
