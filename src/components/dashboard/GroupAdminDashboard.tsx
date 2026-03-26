import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatDate, cn } from '@/lib/utils'
import {
  Users, Package, ShoppingCart, AlertTriangle, Clock,
  CheckCircle, IndianRupee, Shield, Settings, BarChart3, Building2
} from 'lucide-react'
import SeedDataBanner from '@/components/ui/SeedDataBanner'
import DashboardChartsWrapper from '@/components/dashboard/DashboardChartsWrapper'
import { StatCard, QuickAction, SectionHeader, PORow, InvoiceRow, LowStockTable, EmptyRow } from './DashboardHelpers'

export default async function GroupAdminDashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: centres },
    { count: vendorCount },
    { count: pendingApprovals },
    { count: activePOs },
    { data: overdueInvoices },
    { data: lowStockItems },
    { data: recentPendingPOs },
    { data: mtdPOs },
    { data: allCentreStats },
  ] = await Promise.all([
    supabase.from('centres').select('*').eq('is_active', true).order('code'),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval').is('deleted_at', null),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).in('status', ['approved', 'sent_to_vendor']).is('deleted_at', null),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('payment_status', 'unpaid')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('item_centre_stock')
      .select('*, item:items(item_code, generic_name, unit), centre:centres(code,name)')
      .filter('current_stock', 'lte', 'reorder_level')
      .gt('reorder_level', 0)
      .limit(10),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .eq('status', 'pending_approval')
      .is('deleted_at', null)
      .order('total_amount', { ascending: false })
      .limit(8),
    supabase.from('purchase_orders')
      .select('total_amount')
      .gte('po_date', monthStart)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled'),
    // Per-centre PO counts for summary
    supabase.from('purchase_orders')
      .select('centre_id, total_amount, status')
      .gte('po_date', monthStart)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled'),
  ])

  // Check if master data exists (for seed banner)
  const [
    { count: vendorCatCount },
    { count: itemCatCount },
  ] = await Promise.all([
    supabase.from('vendor_categories').select('*', { count: 'exact', head: true }),
    supabase.from('item_categories').select('*', { count: 'exact', head: true }),
  ])

  const totalSpendMTD = (mtdPOs || []).reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0)
  const overdueCount = overdueInvoices?.length ?? 0
  const lowStockCount = lowStockItems?.length ?? 0

  // Build centre-wise stats
  const centreStats = (centres || []).map(centre => {
    const centrePOs = (allCentreStats || []).filter((po: any) => po.centre_id === centre.id)
    const centreSpend = centrePOs.reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0)
    const centrePending = centrePOs.filter((po: any) => po.status === 'pending_approval').length
    return { ...centre, spend: centreSpend, poCount: centrePOs.length, pending: centrePending }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Group Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/purchase-orders?status=pending_approval" icon={<Shield size={16} />} label="Approve POs" variant="primary" />
          <QuickAction href="/reports" icon={<BarChart3 size={16} />} label="Reports" variant="navy" />
          <QuickAction href="/settings/users" icon={<Settings size={16} />} label="Users" variant="secondary" />
        </div>
      </div>

      {/* Master Data Seed Banner — shown when centres/categories are missing */}
      <SeedDataBanner
        hasCentres={(centres?.length ?? 0) > 0}
        hasVendorCategories={(vendorCatCount ?? 0) > 0}
        hasItemCategories={(itemCatCount ?? 0) > 0}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total Spend (MTD)"
          value={formatLakhs(totalSpendMTD)}
          sub={`Since ${formatDate(monthStart)}`}
          icon={<IndianRupee size={22} className="text-navy-600" />}
          bg="bg-navy-50"
          href="/reports"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals ?? 0}
          sub="POs awaiting action"
          icon={<Clock size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/purchase-orders?status=pending_approval"
          alert={(pendingApprovals ?? 0) > 0}
        />
        <StatCard
          label="Active POs"
          value={activePOs ?? 0}
          sub="Approved & in transit"
          icon={<ShoppingCart size={22} className="text-teal-500" />}
          bg="bg-teal-50"
          href="/purchase-orders?status=approved"
        />
        <StatCard
          label="Overdue Invoices"
          value={overdueCount}
          sub="Payment past due"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/finance/credit"
          alert={overdueCount > 0}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStockCount}
          sub="Below reorder level"
          icon={<Package size={22} className="text-amber-600" />}
          bg="bg-amber-50"
          href="/items/stock"
          alert={lowStockCount > 0}
        />
        <StatCard
          label="Active Vendors"
          value={vendorCount ?? 0}
          sub="Registered suppliers"
          icon={<Users size={22} className="text-navy-600" />}
          bg="bg-navy-50"
          href="/vendors"
        />
      </div>

      {/* Centre-wise Summary Cards */}
      {centreStats.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-navy-600" />
            Centre-wise Summary (MTD)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {centreStats.map(centre => (
              <Link key={centre.id} href={`/purchase-orders?centre=${centre.id}`} className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-navy-50 text-navy-600 font-semibold">{centre.code}</span>
                  {centre.pending > 0 && (
                    <span className="badge bg-yellow-100 text-yellow-800 text-[9px]">{centre.pending} pending</span>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">{formatLakhs(centre.spend)}</div>
                <div className="text-xs text-gray-500">{centre.poCount} POs this month</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recharts — Spend by Centre + PO Pipeline */}
      <DashboardChartsWrapper
        centreData={centreStats.map(c => ({ centre: c.code, amount: c.spend }))}
        pipelineData={(() => {
          const statusMap = new Map<string, number>()
          allCentreStats?.forEach((po: any) => statusMap.set(po.status, (statusMap.get(po.status) || 0) + 1))
          return [
            { status: 'pending_approval', label: 'Pending Approval', count: statusMap.get('pending_approval') || 0 },
            { status: 'approved', label: 'Approved', count: statusMap.get('approved') || 0 },
            { status: 'sent_to_vendor', label: 'Sent to Vendor', count: statusMap.get('sent_to_vendor') || 0 },
            { status: 'partially_received', label: 'Partially Received', count: statusMap.get('partially_received') || 0 },
            { status: 'fully_received', label: 'Fully Received', count: statusMap.get('fully_received') || 0 },
          ].filter(d => d.count > 0)
        })()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POs Awaiting Approval */}
        <div className="card">
          <SectionHeader title="POs Awaiting Approval" href="/purchase-orders?status=pending_approval" icon={<Clock size={16} className="text-orange-500" />} />
          <div className="divide-y divide-gray-100">
            {recentPendingPOs && recentPendingPOs.length > 0 ? (
              recentPendingPOs.map((po: any) => <PORow key={po.id} po={po} />)
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="All POs approved" />
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

        {/* Low Stock Alerts */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="card lg:col-span-2">
            <SectionHeader title="Critical Stock Alerts" href="/items/stock" icon={<AlertTriangle size={16} className="text-orange-500" />} />
            <LowStockTable items={lowStockItems} />
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// GROUP CAO — Group-level finance overview
// ═══════════════════════════════════════════════════════════════

