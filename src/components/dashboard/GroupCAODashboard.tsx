import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatDate, cn } from '@/lib/utils'
import { PO_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import {
  Users, AlertTriangle, Clock, CheckCircle, IndianRupee,
  Shield, CreditCard, Calendar, Timer
} from 'lucide-react'
import { StatCard, QuickAction, SectionHeader, PORow, InvoiceRow, EmptyRow } from './DashboardHelpers'

export default async function GroupCAODashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  // Saturday payment: find next Saturday
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
  const nextSaturday = new Date(now)
  nextSaturday.setDate(now.getDate() + daysUntilSat)
  const saturdayDate = nextSaturday.toISOString().split('T')[0]

  const [
    { data: mtdPOs },
    { data: highValuePending },
    { data: overdueInvoices },
    { data: unpaidInvoices },
    { data: topVendorOutstanding },
    { count: pendingHighValue },
  ] = await Promise.all([
    supabase.from('purchase_orders')
      .select('total_amount')
      .gte('po_date', monthStart)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled'),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .eq('status', 'pending_approval')
      .gt('total_amount', 200000)
      .is('deleted_at', null)
      .order('total_amount', { ascending: false })
      .limit(8),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('payment_status', 'unpaid')
      .lt('due_date', today)
      .order('total_amount', { ascending: false })
      .limit(5),
    supabase.from('invoices')
      .select('total_amount, due_date')
      .eq('payment_status', 'unpaid')
      .lte('due_date', saturdayDate),
    supabase.from('invoices')
      .select('vendor_id, vendor:vendors(legal_name, vendor_code), total_amount, paid_amount')
      .eq('payment_status', 'unpaid')
      .order('total_amount', { ascending: false })
      .limit(20),
    supabase.from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval')
      .gt('total_amount', 200000)
      .is('deleted_at', null),
  ])

  const groupSpendMTD = (mtdPOs || []).reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0)
  const paymentDueSaturday = (unpaidInvoices || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
  const totalOutstanding = (topVendorOutstanding || []).reduce((sum: number, inv: any) => sum + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0)

  // Aggregate vendor outstanding
  const vendorMap = new Map<string, { name: string; code: string; outstanding: number }>()
  ;(topVendorOutstanding || []).forEach((inv: any) => {
    const vid = inv.vendor_id
    const existing = vendorMap.get(vid)
    const outstanding = (inv.total_amount || 0) - (inv.paid_amount || 0)
    if (existing) {
      existing.outstanding += outstanding
    } else {
      vendorMap.set(vid, {
        name: inv.vendor?.legal_name || 'Unknown',
        code: inv.vendor?.vendor_code || '',
        outstanding,
      })
    }
  })
  const topVendors = Array.from(vendorMap.values())
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 10)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Group Finance Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/purchase-orders?status=pending_approval&min_amount=200000" icon={<Shield size={16} />} label="Approve High-Value POs" variant="primary" />
          <QuickAction href="/finance/payments" icon={<CreditCard size={16} />} label="Payment Batches" variant="navy" />
          <QuickAction href="/finance/credit" icon={<Timer size={16} />} label="Credit Aging" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Group Spend (MTD)"
          value={formatLakhs(groupSpendMTD)}
          sub={`Since ${formatDate(monthStart)}`}
          icon={<IndianRupee size={22} className="text-navy-600" />}
          bg="bg-navy-50"
          href="/reports"
        />
        <StatCard
          label="Pending Approvals (>2L)"
          value={pendingHighValue ?? 0}
          sub="POs requiring CAO approval"
          icon={<Clock size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/purchase-orders?status=pending_approval&min_amount=200000"
          alert={(pendingHighValue ?? 0) > 0}
        />
        <StatCard
          label="Payment Due Saturday"
          value={formatLakhs(paymentDueSaturday)}
          sub={`Due by ${formatDate(nextSaturday)}`}
          icon={<Calendar size={22} className="text-teal-500" />}
          bg="bg-teal-50"
          href="/finance/payments"
          alert={paymentDueSaturday > 0}
        />
        <StatCard
          label="Outstanding Amount"
          value={formatLakhs(totalOutstanding)}
          sub="Total unpaid invoices"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/finance/credit"
          alert={totalOutstanding > 500000}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-Value POs Awaiting Approval */}
        <div className="card">
          <SectionHeader title="POs Awaiting CAO Approval (>₹2L)" href="/purchase-orders?status=pending_approval" icon={<Shield size={16} className="text-orange-500" />} />
          <div className="divide-y divide-gray-100">
            {highValuePending && highValuePending.length > 0 ? (
              highValuePending.map((po: any) => <PORow key={po.id} po={po} />)
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No high-value POs pending" />
            )}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="card">
          <SectionHeader title="Overdue Invoices" href="/finance/credit" linkText="Full aging" icon={<AlertTriangle size={16} className="text-red-500" />} />
          <div className="divide-y divide-gray-100">
            {overdueInvoices && overdueInvoices.length > 0 ? (
              overdueInvoices.map((inv: any) => <InvoiceRow key={inv.id} inv={inv} />)
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No overdue invoices" />
            )}
          </div>
        </div>

        {/* Top 10 Vendor Outstanding */}
        <div className="card lg:col-span-2">
          <SectionHeader title="Top 10 Vendor Outstanding" href="/finance/credit" icon={<Users size={16} className="text-navy-600" />} />
          {topVendors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vendor</th>
                    <th>Code</th>
                    <th>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {topVendors.map((v, idx) => (
                    <tr key={v.code}>
                      <td className="text-gray-500">{idx + 1}</td>
                      <td className="font-medium text-gray-900">{v.name}</td>
                      <td><span className="badge bg-gray-100 text-gray-600">{v.code}</span></td>
                      <td className="font-semibold text-red-600">{formatLakhs(v.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No outstanding amounts" />
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UNIT CAO — Unit-level finance & approvals
// ═══════════════════════════════════════════════════════════════

