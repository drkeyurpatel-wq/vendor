import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatDate, cn, timeAgo } from '@/lib/utils'
import { PO_STATUS_COLORS } from '@/lib/utils'
import {
  AlertTriangle, AlertCircle, Package, PackageCheck, PackagePlus, Truck
} from 'lucide-react'
import { StatCard, QuickAction, SectionHeader, EmptyRow } from './DashboardHelpers'

export default async function StoreStaffDashboard({ profile }: { profile: any }) {
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

