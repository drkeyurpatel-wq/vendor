import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn, formatLakhs, formatDate, formatCurrency } from '@/lib/utils'
import { PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import CreditAgingCharts from './CreditAgingCharts'

export const dynamic = 'force-dynamic'

export default async function CreditPeriodPage() {
  const { supabase, role, isGroupLevel } = await requireAuth()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: overdueInvoices },
    { data: criticalInvoices },
    { data: upcomingInvoices },
    { data: summary },
  ] = await Promise.all([
    // Overdue (past due date)
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name,bank_name), centre:centres(code,name)')
      .neq('payment_status', 'paid')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(30),

    // Critical (due within 7 days)
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .neq('payment_status', 'paid')
      .gte('due_date', today)
      .lte('due_date', new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(20),

    // Upcoming (due within 30 days)
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .neq('payment_status', 'paid')
      .gt('due_date', new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0])
      .lte('due_date', new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(20),

    // Summary totals
    supabase.from('invoices')
      .select('total_amount, payment_status, due_date')
      .neq('payment_status', 'paid'),
  ])

  const overdueTotal = overdueInvoices?.reduce((s: number, i: any) => s + (i.total_amount - i.paid_amount), 0) ?? 0
  const criticalTotal = criticalInvoices?.reduce((s: number, i: any) => s + i.total_amount, 0) ?? 0
  const upcomingTotal = upcomingInvoices?.reduce((s: number, i: any) => s + i.total_amount, 0) ?? 0

  // Compute aging buckets for chart
  const agingBuckets = [
    { bucket: 'Current', amount: 0, color: '#22c55e' },
    { bucket: '1-30 days', amount: 0, color: '#eab308' },
    { bucket: '31-60 days', amount: 0, color: '#f97316' },
    { bucket: '61-90 days', amount: 0, color: '#ef4444' },
    { bucket: '90+ days', amount: 0, color: '#991b1b' },
  ]
  summary?.forEach((inv: any) => {
    const daysOverdue = Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 0) agingBuckets[0].amount += inv.total_amount || 0
    else if (daysOverdue <= 30) agingBuckets[1].amount += inv.total_amount || 0
    else if (daysOverdue <= 60) agingBuckets[2].amount += inv.total_amount || 0
    else if (daysOverdue <= 90) agingBuckets[3].amount += inv.total_amount || 0
    else agingBuckets[4].amount += inv.total_amount || 0
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Credit Period & Aging</h1>
          <p className="page-subtitle">Vendor invoice payment status and aging analysis</p>
        </div>
        <Link href="/finance/payments" className="btn-primary">View Payment Batches</Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={20} className="text-red-500" />
            <span className="font-semibold text-gray-700">Overdue</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(overdueTotal)}</div>
          <div className="text-sm text-gray-500 mt-1">{overdueInvoices?.length ?? 0} invoices past due date</div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-orange-500" />
            <span className="font-semibold text-gray-700">Due in 7 Days</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{formatLakhs(criticalTotal)}</div>
          <div className="text-sm text-gray-500 mt-1">{criticalInvoices?.length ?? 0} invoices critical</div>
        </div>
        <div className="stat-card border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-blue-500" />
            <span className="font-semibold text-gray-700">Due in 30 Days</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{formatLakhs(upcomingTotal)}</div>
          <div className="text-sm text-gray-500 mt-1">{upcomingInvoices?.length ?? 0} invoices upcoming</div>
        </div>
      </div>

      {/* Aging Chart */}
      <div className="mb-6">
        <CreditAgingCharts agingData={agingBuckets} />
      </div>

      {/* Overdue Table */}
      {(overdueInvoices?.length ?? 0) > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-semibold text-red-700">Overdue Invoices</h2>
            <span className="badge bg-red-100 text-red-700 ml-auto">{overdueInvoices?.length} invoices</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Centre</th>
                  <th>Invoice No.</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices?.map((inv: any) => {
                  const daysOverdue = Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000*60*60*24))
                  const outstanding = inv.total_amount - (inv.paid_amount ?? 0)
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td>
                        <div className="font-medium text-gray-900">{inv.vendor?.legal_name}</div>
                        {inv.vendor?.bank_name && <div className="text-xs text-gray-500">{inv.vendor.bank_name}</div>}
                      </td>
                      <td><span className="badge bg-gray-100 text-gray-700">{inv.centre?.code}</span></td>
                      <td><Link href={`/finance/invoices/${inv.id}`} className="font-mono text-xs text-teal-600 hover:underline font-semibold">{inv.vendor_invoice_no}</Link></td>
                      <td className="text-sm text-gray-600">{formatDate(inv.vendor_invoice_date)}</td>
                      <td className="text-sm text-red-600 font-medium">{formatDate(inv.due_date)}</td>
                      <td>
                        <span className={cn('badge', daysOverdue > 30 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800')}>
                          {daysOverdue}d overdue
                        </span>
                      </td>
                      <td className="font-semibold text-red-600">{formatLakhs(outstanding)}</td>
                      <td>
                        <span className={cn('badge', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                          {inv.payment_status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Critical (due in 7 days) */}
      {(criticalInvoices?.length ?? 0) > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" />
            <h2 className="font-semibold text-orange-700">Due Within 7 Days</h2>
            <span className="badge bg-orange-100 text-orange-700 ml-auto">{criticalInvoices?.length} invoices</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Centre</th>
                  <th>Invoice No.</th>
                  <th>Due Date</th>
                  <th>Days Left</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {criticalInvoices?.map((inv: any) => {
                  const daysLeft = Math.ceil((new Date(inv.due_date).getTime() - Date.now()) / (1000*60*60*24))
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="font-medium text-gray-900">{inv.vendor?.legal_name}</td>
                      <td><span className="badge bg-gray-100 text-gray-700">{inv.centre?.code}</span></td>
                      <td><Link href={`/finance/invoices/${inv.id}`} className="font-mono text-xs text-teal-600 hover:underline font-semibold">{inv.vendor_invoice_no}</Link></td>
                      <td className="text-sm font-medium text-orange-700">{formatDate(inv.due_date)}</td>
                      <td><span className="badge bg-yellow-100 text-yellow-800">{daysLeft}d left</span></td>
                      <td className="font-semibold text-gray-900">{formatLakhs(inv.total_amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
