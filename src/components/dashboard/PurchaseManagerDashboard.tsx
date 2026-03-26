import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatDate, cn, timeAgo } from '@/lib/utils'
import { PO_STATUS_COLORS } from '@/lib/utils'
import {
  AlertTriangle, ShoppingCart, ClipboardList, FileText,
  Package, Truck
} from 'lucide-react'
import { StatCard, QuickAction, SectionHeader, PORow, EmptyRow } from './DashboardHelpers'

export default async function PurchaseManagerDashboard({ profile }: { profile: any }) {
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
          icon={<ShoppingCart size={22} className="text-teal-500" />}
          bg="bg-teal-50"
          href="/purchase-orders"
        />
        <StatCard
          label="Pending Indents"
          value={pendingIndents ?? 0}
          sub="Awaiting PO creation"
          icon={<ClipboardList size={22} className="text-navy-600" />}
          bg="bg-navy-50"
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
              <EmptyRow icon={<ShoppingCart size={32} className="text-gray-500" />} message="No draft POs" />
            )}
          </div>
        </div>

        {/* Open Indents */}
        <div className="card">
          <SectionHeader title="Open Indents" href="/purchase-orders/indents" icon={<ClipboardList size={16} className="text-navy-600" />} />
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
                    className="text-xs text-teal-500 hover:underline font-medium ml-4">
                    Create PO
                  </Link>
                </div>
              ))
            ) : (
              <EmptyRow icon={<ClipboardList size={32} className="text-gray-500" />} message="No open indents" />
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
              <EmptyRow icon={<Truck size={32} className="text-gray-500" />} message="No pending deliveries" />
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
                    <div className="text-xs text-gray-500">{s.item?.item_code}</div>
                  </div>
                  <div className="text-right ml-4">
                    <span className={cn('text-sm font-semibold',
                      s.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                    )}>
                      {s.current_stock}/{s.reorder_level} {s.item?.unit}
                    </span>
                  </div>
                  <Link href={`/purchase-orders/new?item=${s.item_id}`}
                    className="text-xs text-teal-500 hover:underline font-medium ml-3">
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

