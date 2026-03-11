import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatLakhs, formatDate, getDueDateStatus, cn } from '@/lib/utils'
import { VENDOR_STATUS_COLORS, PO_STATUS_COLORS } from '@/lib/utils'
import { isGroupLevel } from '@/types/database'
import {
  Users, Package, ShoppingCart, AlertTriangle,
  TrendingUp, Clock, CheckCircle, XCircle, ArrowRight
} from 'lucide-react'

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

  const isGroup = isGroupLevel(profile.role)
  const centreFilter = isGroup ? {} : { centre_id: profile.centre_id }

  // Parallel data fetching
  const [
    { count: vendorCount },
    { count: activeVendorCount },
    { count: pendingVendorCount },
    { count: itemCount },
    { count: pendingPoCount },
    { count: approvedPoCount },
    { data: recentPOs },
    { data: overdueInvoices },
    { data: lowStockItems },
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('items').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval').is('deleted_at', null),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'approved').is('deleted_at', null),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('payment_status', 'unpaid')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('item_centre_stock')
      .select('*, item:items(item_code, generic_name, unit), centre:centres(code,name)')
      .filter('current_stock', 'lte', 'reorder_level')
      .gt('reorder_level', 0)
      .limit(8),
  ])

  const stats = [
    {
      label: 'Total Vendors',
      value: vendorCount ?? 0,
      sub: `${activeVendorCount ?? 0} active · ${pendingVendorCount ?? 0} pending`,
      icon: <Users size={22} className="text-[#1B3A6B]" />,
      bg: 'bg-[#EEF2F9]',
      href: '/vendors',
    },
    {
      label: 'Active SKUs',
      value: itemCount ?? 0,
      sub: 'In item master',
      icon: <Package size={22} className="text-[#0D7E8A]" />,
      bg: 'bg-[#E6F5F6]',
      href: '/items',
    },
    {
      label: 'POs Pending Approval',
      value: pendingPoCount ?? 0,
      sub: `${approvedPoCount ?? 0} approved, awaiting delivery`,
      icon: <Clock size={22} className="text-orange-600" />,
      bg: 'bg-orange-50',
      href: '/purchase-orders?status=pending_approval',
      alert: (pendingPoCount ?? 0) > 0,
    },
    {
      label: 'Overdue Invoices',
      value: overdueInvoices?.length ?? 0,
      sub: 'Payment past due date',
      icon: <AlertTriangle size={22} className="text-red-600" />,
      bg: 'bg-red-50',
      href: '/finance/credit',
      alert: (overdueInvoices?.length ?? 0) > 0,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isGroup ? 'Group Dashboard' : profile.centre?.name}
          </h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <Link href="/purchase-orders/new" className="btn-primary">
          <ShoppingCart size={16} />
          New Purchase Order
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="stat-card hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2.5 rounded-xl', stat.bg)}>
                {stat.icon}
              </div>
              {stat.alert && (
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1" />
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent POs */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
            <Link href="/purchase-orders" className="text-xs text-[#0D7E8A] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPOs && recentPOs.length > 0 ? (
              recentPOs.map((po: any) => (
                <Link key={po.id} href={`/purchase-orders/${po.id}`}
                  className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{po.po_number}</span>
                      <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {po.vendor?.legal_name} · {po.centre?.code}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(po.total_amount)}
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state py-10">
                <ShoppingCart size={32} className="mb-2" />
                <p className="text-sm">No purchase orders yet</p>
                <Link href="/purchase-orders/new" className="btn-primary mt-3 text-xs">Create first PO</Link>
              </div>
            )}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Overdue Invoices</h2>
            <Link href="/finance/credit" className="text-xs text-[#0D7E8A] hover:underline flex items-center gap-1">
              Full aging <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {overdueInvoices && overdueInvoices.length > 0 ? (
              overdueInvoices.map((inv: any) => {
                const status = getDueDateStatus(inv.due_date)
                return (
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
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold text-red-600">{formatLakhs(inv.total_amount)}</div>
                      <div className="text-xs text-red-500">Overdue</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state py-10">
                <CheckCircle size={32} className="text-green-400 mb-2" />
                <p className="text-sm text-green-600">No overdue invoices</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="card lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                Low Stock Alerts
              </h2>
              <Link href="/items/stock" className="text-xs text-[#0D7E8A] hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
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
                  {lowStockItems.map((s: any) => (
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
          </div>
        )}
      </div>
    </div>
  )
}
