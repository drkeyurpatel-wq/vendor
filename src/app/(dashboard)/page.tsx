import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatLakhs, formatDate, formatCurrency, getDueDateStatus, cn, timeAgo } from '@/lib/utils'
import { VENDOR_STATUS_COLORS, PO_STATUS_COLORS, MATCH_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { isGroupLevel, type UserRole } from '@/types/database'
import {
  Users, Package, ShoppingCart, AlertTriangle, TrendingUp, Clock,
  CheckCircle, XCircle, ArrowRight, IndianRupee, FileText, Truck,
  ClipboardList, BarChart3, Settings, Calendar, Shield, Building2,
  PackageCheck, PackagePlus, ScanBarcode, AlertCircle, CreditCard,
  FileCheck, Layers, Timer, Activity, ChevronRight, Box
} from 'lucide-react'

// ─── Shared UI helpers ───────────────────────────────────────

function StatCard({ label, value, sub, icon, bg, href, alert: hasAlert }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  bg: string
  href: string
  alert?: boolean
}) {
  return (
    <Link href={href} className="stat-card hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2.5 rounded-xl', bg)}>
          {icon}
        </div>
        {hasAlert && (
          <span className="w-2 h-2 bg-red-500 rounded-full mt-1 animate-pulse" />
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </Link>
  )
}

function QuickAction({ href, icon, label, variant = 'primary' }: {
  href: string
  icon: React.ReactNode
  label: string
  variant?: 'primary' | 'navy' | 'secondary'
}) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'navy' ? 'btn-navy' : 'btn-secondary'
  return (
    <Link href={href} className={cn(cls, 'text-sm')}>
      {icon}
      {label}
    </Link>
  )
}

function SectionHeader({ title, href, linkText, icon }: {
  title: string
  href?: string
  linkText?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-xs text-[#0D7E8A] hover:underline flex items-center gap-1">
          {linkText || 'View all'} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}

function EmptyRow({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="empty-state py-10">
      {icon}
      <p className="text-sm mt-2">{message}</p>
    </div>
  )
}

function PORow({ po }: { po: any }) {
  return (
    <Link href={`/purchase-orders/${po.id}`}
      className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{po.po_number}</span>
          <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
            {po.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {po.vendor?.legal_name} {po.centre?.code ? `· ${po.centre.code}` : ''}
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-800 ml-4">
        {formatLakhs(po.total_amount)}
      </div>
    </Link>
  )
}

function InvoiceRow({ inv }: { inv: any }) {
  return (
    <div className="flex items-center px-5 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
          {inv.centre && <span className="text-xs text-gray-400">{inv.centre.code}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Due {formatDate(inv.due_date)} · {inv.vendor_invoice_no}
        </div>
      </div>
      <div className="text-right ml-4">
        <div className="text-sm font-semibold text-red-600">{formatLakhs(inv.total_amount)}</div>
        <div className="text-xs text-red-500">Overdue</div>
      </div>
    </div>
  )
}

function LowStockTable({ items }: { items: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Centre</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s: any) => (
            <tr key={s.id}>
              <td>
                <div className="font-medium text-gray-900">{s.item?.generic_name}</div>
                <div className="text-xs text-gray-400">{s.item?.item_code}</div>
              </td>
              <td><span className="badge bg-blue-50 text-blue-700">{s.centre?.code}</span></td>
              <td>
                <span className={cn(
                  'font-semibold',
                  s.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                )}>
                  {s.current_stock} {s.item?.unit}
                </span>
              </td>
              <td className="text-gray-600">{s.reorder_level} {s.item?.unit}</td>
              <td>
                <Link href={`/purchase-orders/new?item=${s.item_id}`}
                  className="text-xs text-[#0D7E8A] hover:underline font-medium">
                  Raise PO
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as UserRole

  switch (role) {
    case 'group_admin':
      return <GroupAdminDashboard profile={profile} />
    case 'group_cao':
      return <GroupCAODashboard profile={profile} />
    case 'unit_cao':
      return <UnitCAODashboard profile={profile} />
    case 'unit_purchase_manager':
      return <PurchaseManagerDashboard profile={profile} />
    case 'store_staff':
      return <StoreStaffDashboard profile={profile} />
    case 'finance_staff':
      return <FinanceStaffDashboard profile={profile} />
    default:
      redirect('/login')
  }
}

// ═══════════════════════════════════════════════════════════════
// GROUP ADMIN — Full visibility across all centres
// ═══════════════════════════════════════════════════════════════

async function GroupAdminDashboard({ profile }: { profile: any }) {
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Group Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/purchase-orders?status=pending_approval" icon={<Shield size={16} />} label="Approve POs" variant="primary" />
          <QuickAction href="/reports" icon={<BarChart3 size={16} />} label="Reports" variant="navy" />
          <QuickAction href="/settings/users" icon={<Settings size={16} />} label="Users" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total Spend (MTD)"
          value={formatLakhs(totalSpendMTD)}
          sub={`Since ${formatDate(monthStart)}`}
          icon={<IndianRupee size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
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
          icon={<ShoppingCart size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
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
          icon={<Users size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
          href="/vendors"
        />
      </div>

      {/* Centre-wise Summary Cards */}
      {centreStats.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-[#1B3A6B]" />
            Centre-wise Summary (MTD)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {centreStats.map(centre => (
              <div key={centre.id} className="stat-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-[#EEF2F9] text-[#1B3A6B]">{centre.code}</span>
                  {centre.pending > 0 && (
                    <span className="badge bg-yellow-100 text-yellow-800">{centre.pending} pending</span>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">{formatLakhs(centre.spend)}</div>
                <div className="text-xs text-gray-500">{centre.poCount} POs this month</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Spend Trend — stat card format */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#0D7E8A]" />
          Spend by Centre (MTD)
        </h2>
        <div className="card p-5">
          <div className="space-y-3">
            {centreStats.map(centre => {
              const maxSpend = Math.max(...centreStats.map(c => c.spend), 1)
              const pct = (centre.spend / maxSpend) * 100
              return (
                <div key={centre.id} className="flex items-center gap-3">
                  <span className="w-12 text-xs font-semibold text-gray-600">{centre.code}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1B3A6B]"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm font-semibold text-gray-700">{formatLakhs(centre.spend)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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

async function GroupCAODashboard({ profile }: { profile: any }) {
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
          icon={<IndianRupee size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
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
          icon={<Calendar size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
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
          <SectionHeader title="Top 10 Vendor Outstanding" href="/finance/credit" icon={<Users size={16} className="text-[#1B3A6B]" />} />
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
                      <td className="text-gray-400">{idx + 1}</td>
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

async function UnitCAODashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const centreId = profile.centre_id
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: mtdPOs },
    { data: pendingPOs },
    { data: pendingInvoices },
    { data: recentGRNs },
    { count: invoicesToVerify },
    { data: unpaidInvoices },
  ] = await Promise.all([
    supabase.from('purchase_orders')
      .select('total_amount')
      .eq('centre_id', centreId)
      .gte('po_date', monthStart)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled'),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .eq('centre_id', centreId)
      .eq('status', 'pending_approval')
      .gte('total_amount', 50000)
      .lte('total_amount', 200000)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('centre_id', centreId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('grns')
      .select('*, vendor:vendors(legal_name), po:purchase_orders(po_number)')
      .eq('centre_id', centreId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('centre_id', centreId)
      .eq('match_status', 'pending'),
    supabase.from('invoices')
      .select('total_amount, due_date')
      .eq('centre_id', centreId)
      .eq('payment_status', 'unpaid')
      .lte('due_date', today),
  ])

  const unitSpendMTD = (mtdPOs || []).reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0)
  const pendingApprovalCount = pendingPOs?.length ?? 0
  const paymentDue = (unpaidInvoices || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile.centre?.name || 'Unit'} Finance Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/purchase-orders?status=pending_approval" icon={<Shield size={16} />} label="Approve POs" variant="primary" />
          <QuickAction href="/finance/invoices" icon={<FileCheck size={16} />} label="Verify Invoices" variant="navy" />
          <QuickAction href="/reports" icon={<BarChart3 size={16} />} label="Unit Reports" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Unit Spend (MTD)"
          value={formatLakhs(unitSpendMTD)}
          sub={`${profile.centre?.code || ''} this month`}
          icon={<IndianRupee size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
          href="/reports"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovalCount}
          sub="₹50K–₹2L range"
          icon={<Clock size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/purchase-orders?status=pending_approval"
          alert={pendingApprovalCount > 0}
        />
        <StatCard
          label="Invoices to Verify"
          value={invoicesToVerify ?? 0}
          sub="Awaiting 3-way match"
          icon={<FileText size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
          href="/finance/invoices"
          alert={(invoicesToVerify ?? 0) > 0}
        />
        <StatCard
          label="Payment Due"
          value={formatLakhs(paymentDue)}
          sub="Overdue unpaid invoices"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/finance/credit"
          alert={paymentDue > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending POs */}
        <div className="card">
          <SectionHeader title="POs Awaiting Your Approval" href="/purchase-orders?status=pending_approval" icon={<Shield size={16} className="text-orange-500" />} />
          <div className="divide-y divide-gray-100">
            {pendingPOs && pendingPOs.length > 0 ? (
              pendingPOs.map((po: any) => <PORow key={po.id} po={po} />)
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No POs pending approval" />
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="card">
          <SectionHeader title="Pending Invoices" href="/finance/invoices" icon={<FileText size={16} className="text-[#0D7E8A]" />} />
          <div className="divide-y divide-gray-100">
            {pendingInvoices && pendingInvoices.length > 0 ? (
              pendingInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
                      <span className={cn('badge', MATCH_STATUS_COLORS[inv.match_status as keyof typeof MATCH_STATUS_COLORS])}>
                        {inv.match_status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {inv.vendor_invoice_no} · {formatDate(inv.vendor_invoice_date)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(inv.total_amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No pending invoices" />
            )}
          </div>
        </div>

        {/* Recent GRNs */}
        <div className="card lg:col-span-2">
          <SectionHeader title="Recent GRNs" href="/grn" icon={<PackageCheck size={16} className="text-green-600" />} />
          <div className="divide-y divide-gray-100">
            {recentGRNs && recentGRNs.length > 0 ? (
              recentGRNs.map((grn: any) => (
                <Link key={grn.id} href={`/grn/${grn.id}`}
                  className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{grn.grn_number}</span>
                      <span className={cn('badge',
                        grn.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        grn.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {grn.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {grn.vendor?.legal_name} · PO: {grn.po?.po_number}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(grn.total_amount)}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyRow icon={<PackageCheck size={32} className="text-gray-300" />} message="No recent GRNs" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UNIT PURCHASE MANAGER — POs, indents, vendor management
// ═══════════════════════════════════════════════════════════════

async function PurchaseManagerDashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const centreId = profile.centre_id

  const [
    { count: activePOs },
    { count: pendingIndents },
    { data: lowStockItems },
    { data: draftPOs },
    { data: openIndents },
    { data: deliveryPending },
    { data: expiringContracts },
  ] = await Promise.all([
    supabase.from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('centre_id', centreId)
      .in('status', ['approved', 'sent_to_vendor', 'pending_approval'])
      .is('deleted_at', null),
    supabase.from('purchase_indents')
      .select('*', { count: 'exact', head: true })
      .eq('centre_id', centreId)
      .in('status', ['pending', 'approved']),
    supabase.from('item_centre_stock')
      .select('*, item:items(item_code, generic_name, unit), centre:centres(code,name)')
      .eq('centre_id', centreId)
      .filter('current_stock', 'lte', 'reorder_level')
      .gt('reorder_level', 0)
      .limit(10),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .eq('centre_id', centreId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase.from('purchase_indents')
      .select('*, centre:centres(code,name)')
      .eq('centre_id', centreId)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .eq('centre_id', centreId)
      .in('status', ['approved', 'sent_to_vendor'])
      .is('deleted_at', null)
      .order('expected_delivery_date', { ascending: true })
      .limit(5),
    supabase.from('rate_contracts')
      .select('*, vendor:vendors(legal_name)')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .lte('end_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
      .eq('status', 'active')
      .limit(5),
  ])

  const lowStockCount = lowStockItems?.length ?? 0
  const expiringContractCount = expiringContracts?.length ?? 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile.centre?.name || 'Unit'} Purchase Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/purchase-orders/new" icon={<ShoppingCart size={16} />} label="Create PO" variant="primary" />
          <QuickAction href="/purchase-orders/indents" icon={<ClipboardList size={16} />} label="Create Indent" variant="navy" />
          <QuickAction href="/items/stock" icon={<Package size={16} />} label="Check Stock" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active POs"
          value={activePOs ?? 0}
          sub="Pending + Approved + In transit"
          icon={<ShoppingCart size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
          href="/purchase-orders"
        />
        <StatCard
          label="Pending Indents"
          value={pendingIndents ?? 0}
          sub="Awaiting PO creation"
          icon={<ClipboardList size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
          href="/purchase-orders/indents"
          alert={(pendingIndents ?? 0) > 0}
        />
        <StatCard
          label="Below Reorder"
          value={lowStockCount}
          sub="Items need replenishment"
          icon={<AlertTriangle size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/items/stock"
          alert={lowStockCount > 0}
        />
        <StatCard
          label="Contracts Expiring"
          value={expiringContractCount}
          sub="Within 30 days"
          icon={<FileText size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/reports"
          alert={expiringContractCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Draft POs */}
        <div className="card">
          <SectionHeader title="Draft POs" href="/purchase-orders?status=draft" icon={<FileText size={16} className="text-gray-500" />} />
          <div className="divide-y divide-gray-100">
            {draftPOs && draftPOs.length > 0 ? (
              draftPOs.map((po: any) => <PORow key={po.id} po={po} />)
            ) : (
              <EmptyRow icon={<ShoppingCart size={32} className="text-gray-300" />} message="No draft POs" />
            )}
          </div>
        </div>

        {/* Open Indents */}
        <div className="card">
          <SectionHeader title="Open Indents" href="/purchase-orders/indents" icon={<ClipboardList size={16} className="text-[#1B3A6B]" />} />
          <div className="divide-y divide-gray-100">
            {openIndents && openIndents.length > 0 ? (
              openIndents.map((indent: any) => (
                <div key={indent.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{indent.indent_number}</span>
                      <span className={cn('badge',
                        indent.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        indent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {indent.status}
                      </span>
                      {indent.priority === 'urgent' && (
                        <span className="badge bg-red-100 text-red-800">URGENT</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {indent.centre?.code} · {timeAgo(indent.created_at)}
                    </div>
                  </div>
                  <Link href={`/purchase-orders/new?indent=${indent.id}`}
                    className="text-xs text-[#0D7E8A] hover:underline font-medium ml-4">
                    Create PO
                  </Link>
                </div>
              ))
            ) : (
              <EmptyRow icon={<ClipboardList size={32} className="text-gray-300" />} message="No open indents" />
            )}
          </div>
        </div>

        {/* Delivery Pending */}
        <div className="card">
          <SectionHeader title="Vendor Delivery Pending" href="/purchase-orders?status=approved" icon={<Truck size={16} className="text-purple-600" />} />
          <div className="divide-y divide-gray-100">
            {deliveryPending && deliveryPending.length > 0 ? (
              deliveryPending.map((po: any) => (
                <Link key={po.id} href={`/purchase-orders/${po.id}`}
                  className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {po.vendor?.legal_name}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-gray-800">{formatLakhs(po.total_amount)}</div>
                    {po.expected_delivery_date && (
                      <div className={cn('text-xs',
                        new Date(po.expected_delivery_date) < new Date() ? 'text-red-500' : 'text-gray-500'
                      )}>
                        {new Date(po.expected_delivery_date) < new Date() ? 'Overdue' : `ETA ${formatDate(po.expected_delivery_date)}`}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyRow icon={<Truck size={32} className="text-gray-300" />} message="No pending deliveries" />
            )}
          </div>
        </div>

        {/* Low Stock */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="card">
            <SectionHeader title="Items Below Reorder" href="/items/stock" icon={<AlertTriangle size={16} className="text-orange-500" />} />
            <div className="divide-y divide-gray-100">
              {lowStockItems.slice(0, 6).map((s: any) => (
                <div key={s.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{s.item?.generic_name}</div>
                    <div className="text-xs text-gray-400">{s.item?.item_code}</div>
                  </div>
                  <div className="text-right ml-4">
                    <span className={cn('text-sm font-semibold',
                      s.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                    )}>
                      {s.current_stock}/{s.reorder_level} {s.item?.unit}
                    </span>
                  </div>
                  <Link href={`/purchase-orders/new?item=${s.item_id}`}
                    className="text-xs text-[#0D7E8A] hover:underline font-medium ml-3">
                    PO
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STORE STAFF — GRN queue, stock, expiry alerts
// ═══════════════════════════════════════════════════════════════

async function StoreStaffDashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const centreId = profile.centre_id
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const [
    { data: todayGRNs },
    { data: pendingDeliveries },
    { data: lowStockItems },
    { data: expiringBatches },
    { data: recentGRNs },
    { count: grnTodayCount },
  ] = await Promise.all([
    supabase.from('grns')
      .select('*')
      .eq('centre_id', centreId)
      .gte('grn_date', today)
      .order('created_at', { ascending: false }),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('centre_id', centreId)
      .in('status', ['approved', 'sent_to_vendor'])
      .is('deleted_at', null)
      .order('expected_delivery_date', { ascending: true })
      .limit(8),
    supabase.from('item_centre_stock')
      .select('*, item:items(item_code, generic_name, unit), centre:centres(code,name)')
      .eq('centre_id', centreId)
      .filter('current_stock', 'lte', 'reorder_level')
      .gt('reorder_level', 0)
      .limit(10),
    supabase.from('batch_stock')
      .select('*, item:items(item_code, generic_name, unit), centre:centres(code)')
      .eq('centre_id', centreId)
      .gt('qty_available', 0)
      .lte('expiry_date', thirtyDaysOut)
      .order('expiry_date', { ascending: true })
      .limit(10),
    supabase.from('grns')
      .select('*, vendor:vendors(legal_name), po:purchase_orders(po_number)')
      .eq('centre_id', centreId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('grns')
      .select('*', { count: 'exact', head: true })
      .eq('centre_id', centreId)
      .gte('grn_date', today),
  ])

  const pendingDeliveryCount = pendingDeliveries?.length ?? 0
  const lowStockCount = lowStockItems?.length ?? 0
  const expiringCount = expiringBatches?.length ?? 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile.centre?.name || 'Store'} Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/grn/new" icon={<PackagePlus size={16} />} label="Create GRN" variant="primary" />
          <QuickAction href="/items/stock" icon={<Package size={16} />} label="Check Stock" variant="navy" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="GRNs Today"
          value={grnTodayCount ?? 0}
          sub="Goods received today"
          icon={<PackageCheck size={22} className="text-green-600" />}
          bg="bg-green-50"
          href="/grn"
        />
        <StatCard
          label="Pending Deliveries"
          value={pendingDeliveryCount}
          sub="Approved POs awaiting receipt"
          icon={<Truck size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
          href="/purchase-orders?status=approved"
          alert={pendingDeliveryCount > 0}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStockCount}
          sub="Below reorder level"
          icon={<AlertTriangle size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/items/stock"
          alert={lowStockCount > 0}
        />
        <StatCard
          label="Expiring (30 days)"
          value={expiringCount}
          sub="Batches nearing expiry"
          icon={<AlertCircle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/items/stock"
          alert={expiringCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expected Deliveries */}
        <div className="card">
          <SectionHeader title="Expected Deliveries" href="/purchase-orders?status=approved" icon={<Truck size={16} className="text-[#0D7E8A]" />} />
          <div className="divide-y divide-gray-100">
            {pendingDeliveries && pendingDeliveries.length > 0 ? (
              pendingDeliveries.map((po: any) => (
                <div key={po.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{po.po_number}</span>
                      <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{po.vendor?.legal_name}</div>
                  </div>
                  <div className="text-right ml-4">
                    {po.expected_delivery_date ? (
                      <div className={cn('text-xs font-medium',
                        new Date(po.expected_delivery_date) < new Date() ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {new Date(po.expected_delivery_date) < new Date() ? 'OVERDUE' : formatDate(po.expected_delivery_date)}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No ETA</div>
                    )}
                  </div>
                  <Link href={`/grn/new?po=${po.id}`}
                    className="btn-primary text-xs ml-3 py-1.5 px-3">
                    <PackagePlus size={14} />
                    GRN
                  </Link>
                </div>
              ))
            ) : (
              <EmptyRow icon={<Truck size={32} className="text-gray-300" />} message="No pending deliveries" />
            )}
          </div>
        </div>

        {/* Recent GRNs */}
        <div className="card">
          <SectionHeader title="Recent GRNs" href="/grn" icon={<PackageCheck size={16} className="text-green-600" />} />
          <div className="divide-y divide-gray-100">
            {recentGRNs && recentGRNs.length > 0 ? (
              recentGRNs.map((grn: any) => (
                <Link key={grn.id} href={`/grn/${grn.id}`}
                  className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{grn.grn_number}</span>
                      <span className={cn('badge',
                        grn.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        grn.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        grn.status === 'discrepancy' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {grn.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {grn.vendor?.legal_name} · {timeAgo(grn.created_at)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(grn.total_amount)}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyRow icon={<PackageCheck size={32} className="text-gray-300" />} message="No recent GRNs" />
            )}
          </div>
        </div>

        {/* Expiry Alerts */}
        {expiringBatches && expiringBatches.length > 0 && (
          <div className="card">
            <SectionHeader title="Expiry Alerts (30 Days)" href="/items/stock" icon={<AlertCircle size={16} className="text-red-500" />} />
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringBatches.map((batch: any) => {
                    const daysLeft = Math.ceil((new Date(batch.expiry_date).getTime() - Date.now()) / 86400000)
                    return (
                      <tr key={batch.id}>
                        <td>
                          <div className="font-medium text-gray-900">{batch.item?.generic_name}</div>
                          <div className="text-xs text-gray-400">{batch.item?.item_code}</div>
                        </td>
                        <td className="text-gray-600">{batch.batch_no}</td>
                        <td className="font-medium">{batch.qty_available} {batch.item?.unit}</td>
                        <td>
                          <span className={cn('badge',
                            daysLeft <= 0 ? 'bg-red-100 text-red-800' :
                            daysLeft <= 7 ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          )}>
                            {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft}d left`}
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

        {/* Low Stock */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="card">
            <SectionHeader title="Low Stock Items" href="/items/stock" icon={<AlertTriangle size={16} className="text-orange-500" />} />
            <div className="divide-y divide-gray-100">
              {lowStockItems.slice(0, 6).map((s: any) => (
                <div key={s.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{s.item?.generic_name}</div>
                    <div className="text-xs text-gray-400">{s.item?.item_code}</div>
                  </div>
                  <div className="text-right ml-2">
                    <span className={cn('text-sm font-semibold',
                      s.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                    )}>
                      {s.current_stock}
                    </span>
                    <span className="text-xs text-gray-400"> / {s.reorder_level} {s.item?.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// FINANCE STAFF — Invoices, payments, credit aging
// ═══════════════════════════════════════════════════════════════

async function FinanceStaffDashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const centreId = profile.centre_id
  const today = new Date().toISOString().split('T')[0]

  // Next Saturday
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
  const nextSaturday = new Date(now)
  nextSaturday.setDate(now.getDate() + daysUntilSat)
  const saturdayDate = nextSaturday.toISOString().split('T')[0]

  const centreFilter = centreId ? { centre_id: centreId } : {}

  const [
    { data: unmatchedInvoices },
    { data: saturdayPayments },
    { data: overdueInvoices },
    { count: unmatchedCount },
    { data: agingData },
    { count: debitNotesPending },
  ] = await Promise.all([
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name, vendor_code), centre:centres(code)')
      .eq('match_status', 'pending')
      .match(centreFilter)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('payment_status', 'unpaid')
      .eq('match_status', 'matched')
      .lte('due_date', saturdayDate)
      .match(centreFilter)
      .order('due_date', { ascending: true })
      .limit(8),
    supabase.from('invoices')
      .select('total_amount, due_date')
      .eq('payment_status', 'unpaid')
      .lt('due_date', today)
      .match(centreFilter),
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('match_status', 'pending')
      .match(centreFilter),
    // For aging summary, pull all unpaid invoices
    supabase.from('invoices')
      .select('total_amount, paid_amount, due_date')
      .eq('payment_status', 'unpaid')
      .match(centreFilter),
    supabase.from('debit_notes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .match(centreFilter),
  ])

  const overdueAmount = (overdueInvoices || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
  const saturdayTotal = (saturdayPayments || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)

  // Aging summary
  const aging = { current: 0, days_0_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0 }
  ;(agingData || []).forEach((inv: any) => {
    const outstanding = (inv.total_amount || 0) - (inv.paid_amount || 0)
    const dueDate = new Date(inv.due_date)
    const nowDate = new Date()
    const daysPast = Math.floor((nowDate.getTime() - dueDate.getTime()) / 86400000)
    if (daysPast <= 0) aging.current += outstanding
    else if (daysPast <= 30) aging.days_0_30 += outstanding
    else if (daysPast <= 60) aging.days_31_60 += outstanding
    else if (daysPast <= 90) aging.days_61_90 += outstanding
    else aging.days_90_plus += outstanding
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile.centre?.name ? `${profile.centre.name} ` : ''}Finance Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/finance/invoices" icon={<FileCheck size={16} />} label="Match Invoices" variant="primary" />
          <QuickAction href="/finance/payments" icon={<CreditCard size={16} />} label="Payment Batch" variant="navy" />
          <QuickAction href="/finance/credit" icon={<Timer size={16} />} label="Credit Aging" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Unmatched Invoices"
          value={unmatchedCount ?? 0}
          sub="Awaiting 3-way match"
          icon={<FileText size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/finance/invoices"
          alert={(unmatchedCount ?? 0) > 0}
        />
        <StatCard
          label="Payment Due Saturday"
          value={formatLakhs(saturdayTotal)}
          sub={`Due by ${formatDate(nextSaturday)}`}
          icon={<Calendar size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
          href="/finance/payments"
          alert={saturdayTotal > 0}
        />
        <StatCard
          label="Overdue Amount"
          value={formatLakhs(overdueAmount)}
          sub="Past due date"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/finance/credit"
          alert={overdueAmount > 0}
        />
        <StatCard
          label="Debit Notes Pending"
          value={debitNotesPending ?? 0}
          sub="Awaiting processing"
          icon={<FileText size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
          href="/finance/invoices"
          alert={(debitNotesPending ?? 0) > 0}
        />
      </div>

      {/* Aging Summary */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Timer size={18} className="text-[#1B3A6B]" />
          Aging Summary
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Current', value: aging.current, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
            { label: '0-30 Days', value: aging.days_0_30, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
            { label: '31-60 Days', value: aging.days_31_60, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
            { label: '61-90 Days', value: aging.days_61_90, color: 'bg-red-50 border-red-200', text: 'text-red-700' },
            { label: '90+ Days', value: aging.days_90_plus, color: 'bg-red-100 border-red-300', text: 'text-red-800' },
          ].map(bucket => (
            <div key={bucket.label} className={cn('stat-card border', bucket.color)}>
              <div className={cn('text-lg font-bold', bucket.text)}>{formatLakhs(bucket.value)}</div>
              <div className="text-xs text-gray-600 mt-1">{bucket.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices Pending 3-Way Match */}
        <div className="card">
          <SectionHeader title="Invoices Pending 3-Way Match" href="/finance/invoices" icon={<FileCheck size={16} className="text-orange-500" />} />
          <div className="divide-y divide-gray-100">
            {unmatchedInvoices && unmatchedInvoices.length > 0 ? (
              unmatchedInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
                      {inv.centre && <span className="text-xs text-gray-400">{inv.centre.code}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {inv.vendor_invoice_no} · {formatDate(inv.vendor_invoice_date)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(inv.total_amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="All invoices matched" />
            )}
          </div>
        </div>

        {/* Saturday Payment Batch */}
        <div className="card">
          <SectionHeader title={`Saturday Payment (${formatDate(nextSaturday)})`} href="/finance/payments" icon={<CreditCard size={16} className="text-[#0D7E8A]" />} />
          <div className="divide-y divide-gray-100">
            {saturdayPayments && saturdayPayments.length > 0 ? (
              saturdayPayments.map((inv: any) => (
                <div key={inv.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
                      {inv.centre && <span className="text-xs text-gray-400">{inv.centre.code}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Due {formatDate(inv.due_date)} · {inv.vendor_invoice_no}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(inv.total_amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No payments due this Saturday" />
            )}
            {saturdayPayments && saturdayPayments.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-sm font-bold text-[#1B3A6B]">{formatLakhs(saturdayTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
