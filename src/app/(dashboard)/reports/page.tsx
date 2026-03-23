import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatCurrency } from '@/lib/utils'
import { ShoppingCart, TrendingUp, Users, Package, AlertTriangle, IndianRupee, FileCheck, Truck } from 'lucide-react'
import ReportsCharts from './ReportsCharts'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: poStats },
    { data: vendorStats },
    { data: invoiceStats },
    { data: stockAlerts },
    { data: centreBreakdown },
    { data: overdueInvoices },
    { data: grnStats },
  ] = await Promise.all([
    supabase.from('purchase_orders').select('status, total_amount').is('deleted_at', null),
    supabase.from('vendors').select('status').is('deleted_at', null),
    supabase.from('invoices').select('total_amount, paid_amount, payment_status, due_date, match_status'),
    supabase.from('item_centre_stock').select('current_stock, reorder_level'),
    supabase.from('purchase_orders')
      .select('total_amount, centre:centres(code, name)')
      .is('deleted_at', null)
      .in('status', ['approved', 'sent_to_vendor', 'partially_received', 'fully_received']),
    supabase.from('invoices')
      .select('total_amount, paid_amount, due_date')
      .neq('payment_status', 'paid')
      .lt('due_date', today),
    supabase.from('grns').select('status').is('deleted_at', null),
  ])

  // KPIs
  const totalPOs = poStats?.length ?? 0
  const totalPOValue = poStats?.reduce((s, p: any) => s + (p.total_amount || 0), 0) ?? 0
  const pendingPOs = poStats?.filter((p: any) => p.status === 'pending_approval').length ?? 0
  const totalVendors = vendorStats?.length ?? 0
  const activeVendors = vendorStats?.filter((v: any) => v.status === 'active').length ?? 0
  const totalInvoiced = invoiceStats?.reduce((s, i: any) => s + (i.total_amount || 0), 0) ?? 0
  const totalPaid = invoiceStats?.reduce((s, i: any) => s + (i.paid_amount || 0), 0) ?? 0
  const outstanding = totalInvoiced - totalPaid
  const lowStockCount = stockAlerts?.filter((s: any) => s.current_stock > 0 && s.current_stock <= s.reorder_level).length ?? 0
  const outOfStockCount = stockAlerts?.filter((s: any) => s.current_stock <= 0 && s.reorder_level > 0).length ?? 0
  const matchedInvoices = invoiceStats?.filter((i: any) => i.match_status === 'matched').length ?? 0
  const mismatchInvoices = invoiceStats?.filter((i: any) => i.match_status === 'mismatch').length ?? 0
  const totalGRNs = grnStats?.length ?? 0
  const verifiedGRNs = grnStats?.filter((g: any) => g.status === 'verified').length ?? 0

  // Spend by centre data
  const centreMap = new Map<string, number>()
  centreBreakdown?.forEach((po: any) => {
    const code = po.centre?.code || 'Other'
    centreMap.set(code, (centreMap.get(code) || 0) + (po.total_amount || 0))
  })
  const centreChartData = Array.from(centreMap.entries())
    .map(([centre, amount]) => ({ centre, amount }))
    .sort((a, b) => b.amount - a.amount)

  // PO pipeline data
  const statusCounts = new Map<string, number>()
  poStats?.forEach((p: any) => statusCounts.set(p.status, (statusCounts.get(p.status) || 0) + 1))
  const pipelineData = [
    { status: 'pending_approval', label: 'Pending Approval', count: statusCounts.get('pending_approval') || 0 },
    { status: 'approved', label: 'Approved', count: statusCounts.get('approved') || 0 },
    { status: 'sent_to_vendor', label: 'Sent to Vendor', count: statusCounts.get('sent_to_vendor') || 0 },
    { status: 'partially_received', label: 'Partially Received', count: statusCounts.get('partially_received') || 0 },
    { status: 'fully_received', label: 'Fully Received', count: statusCounts.get('fully_received') || 0 },
  ].filter(d => d.count > 0)

  // Aging buckets
  const agingBuckets = [
    { bucket: 'Current', amount: 0, color: '#22c55e' },
    { bucket: '1-30d', amount: 0, color: '#eab308' },
    { bucket: '31-60d', amount: 0, color: '#f97316' },
    { bucket: '61-90d', amount: 0, color: '#ef4444' },
    { bucket: '90d+', amount: 0, color: '#991b1b' },
  ]
  invoiceStats?.forEach((inv: any) => {
    if (inv.payment_status === 'paid') return
    const owed = (inv.total_amount || 0) - (inv.paid_amount || 0)
    if (owed <= 0) return
    const daysOverdue = Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 0) agingBuckets[0].amount += owed
    else if (daysOverdue <= 30) agingBuckets[1].amount += owed
    else if (daysOverdue <= 60) agingBuckets[2].amount += owed
    else if (daysOverdue <= 90) agingBuckets[3].amount += owed
    else agingBuckets[4].amount += owed
  })

  const overdueTotal = overdueInvoices?.reduce((s: number, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Procurement metrics across all centres</p>
        </div>
        <Link href="/reports/vendor-performance" className="btn-secondary text-sm">Vendor Performance</Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/purchase-orders" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-navy-600">
          <div className="flex items-center gap-2 mb-1"><ShoppingCart size={16} className="text-navy-600" /><span className="text-xs text-gray-500 font-medium">Purchase Orders</span></div>
          <div className="text-2xl font-bold text-navy-600">{totalPOs}</div>
          <div className="text-xs text-gray-400 mt-1">{pendingPOs} pending approval</div>
        </Link>
        <Link href="/purchase-orders" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-teal-600">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={16} className="text-teal-600" /><span className="text-xs text-gray-500 font-medium">Total PO Value</span></div>
          <div className="text-2xl font-bold text-teal-600">{formatLakhs(totalPOValue)}</div>
        </Link>
        <Link href="/vendors" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-1"><Users size={16} className="text-blue-500" /><span className="text-xs text-gray-500 font-medium">Active Vendors</span></div>
          <div className="text-2xl font-bold text-blue-600">{activeVendors}<span className="text-sm text-gray-400 font-normal">/{totalVendors}</span></div>
        </Link>
        <Link href="/finance/credit" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-red-500" /><span className="text-xs text-gray-500 font-medium">Outstanding</span></div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(outstanding)}</div>
          <div className="text-xs text-red-400 mt-1">{formatLakhs(overdueTotal)} overdue</div>
        </Link>
        <Link href="/finance/invoices" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-1"><IndianRupee size={16} className="text-green-500" /><span className="text-xs text-gray-500 font-medium">Total Invoiced</span></div>
          <div className="text-2xl font-bold text-green-600">{formatLakhs(totalInvoiced)}</div>
          <div className="text-xs text-gray-400 mt-1">{formatLakhs(totalPaid)} paid</div>
        </Link>
        <Link href="/finance/invoices?match_status=matched" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2 mb-1"><FileCheck size={16} className="text-purple-500" /><span className="text-xs text-gray-500 font-medium">3-Way Match</span></div>
          <div className="text-2xl font-bold text-purple-600">{matchedInvoices}<span className="text-sm text-gray-400 font-normal"> matched</span></div>
          <div className="text-xs text-red-400 mt-1">{mismatchInvoices} mismatches</div>
        </Link>
        <Link href="/grn" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-orange-500">
          <div className="flex items-center gap-2 mb-1"><Truck size={16} className="text-orange-500" /><span className="text-xs text-gray-500 font-medium">GRNs</span></div>
          <div className="text-2xl font-bold text-orange-600">{totalGRNs}</div>
          <div className="text-xs text-gray-400 mt-1">{verifiedGRNs} verified</div>
        </Link>
        <Link href="/items/stock" className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-1"><Package size={16} className="text-amber-500" /><span className="text-xs text-gray-500 font-medium">Stock Alerts</span></div>
          <div className="text-2xl font-bold text-amber-600">{lowStockCount + outOfStockCount}</div>
          <div className="text-xs text-red-400 mt-1">{outOfStockCount} out of stock</div>
        </Link>
      </div>

      {/* Charts */}
      <ReportsCharts
        centreData={centreChartData}
        pipelineData={pipelineData}
        agingData={agingBuckets}
      />

      {/* Report Links */}
      <div className="mt-8 mb-2">
        <h2 className="text-lg font-bold text-navy-600 mb-4">Detailed Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/reports/vendor-overdue" className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle size={20} className="text-red-500" /></div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">Vendor Overdue Report</h3>
            </div>
            <p className="text-sm text-gray-500">Outstanding invoices grouped by vendor with aging buckets, email/WhatsApp reminders</p>
          </Link>
          <Link href="/reports/gst-summary" className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center"><IndianRupee size={20} className="text-teal-500" /></div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">GST Summary (GSTR-2)</h3>
            </div>
            <p className="text-sm text-gray-500">Month-wise GSTIN-wise ITC data — taxable value, CGST, SGST, IGST split by vendor</p>
          </Link>
          <Link href="/reports/centre-wise-spend" className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp size={20} className="text-blue-500" /></div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">Centre-wise Spend</h3>
            </div>
            <p className="text-sm text-gray-500">Monthly PO spend breakdown across SHI, VAS, MOD, UDA, GAN with Recharts trend</p>
          </Link>
          <Link href="/reports/po-aging" className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><ShoppingCart size={20} className="text-orange-500" /></div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">PO Aging</h3>
            </div>
            <p className="text-sm text-gray-500">Open POs by age — 0-7d, 8-15d, 16-30d, 31-60d, 60d+ with centre filter</p>
          </Link>
          <Link href="/reports/item-purchase-history" className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Package size={20} className="text-purple-500" /></div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">Item Purchase History</h3>
            </div>
            <p className="text-sm text-gray-500">Per-item purchase trends — avg/min/max rate, qty, rate variation flags (&gt;20%)</p>
          </Link>
          <Link href="/reports/vendor-performance" className="card p-5 hover:shadow-card-hover transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Users size={20} className="text-green-500" /></div>
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">Vendor Performance</h3>
            </div>
            <p className="text-sm text-gray-500">Delivery compliance, rejection rate, quality scores, return trends per vendor</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
