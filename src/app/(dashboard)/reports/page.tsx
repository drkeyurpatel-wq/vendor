import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs } from '@/lib/utils'
import { BarChart3, TrendingUp, ShoppingCart, Users, Package, AlertTriangle, Download } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { data: poStats },
    { data: vendorStats },
    { data: invoiceStats },
    { data: stockAlerts },
    { data: centreBreakdown },
  ] = await Promise.all([
    supabase.from('purchase_orders').select('status, total_amount').is('deleted_at', null),
    supabase.from('vendors').select('status').is('deleted_at', null),
    supabase.from('invoices').select('total_amount, paid_amount, payment_status'),
    supabase.from('item_centre_stock').select('current_stock, reorder_level'),
    supabase.from('purchase_orders')
      .select('total_amount, centre:centres(code, name)')
      .is('deleted_at', null)
      .in('status', ['approved', 'sent_to_vendor', 'partially_received', 'fully_received']),
  ])

  const totalPOs = poStats?.length ?? 0
  const totalPOValue = poStats?.reduce((s, p: any) => s + (p.total_amount || 0), 0) ?? 0
  const approvedPOs = poStats?.filter((p: any) => ['approved', 'sent_to_vendor', 'partially_received', 'fully_received'].includes(p.status)).length ?? 0
  const pendingPOs = poStats?.filter((p: any) => p.status === 'pending_approval').length ?? 0

  const totalVendors = vendorStats?.length ?? 0
  const activeVendors = vendorStats?.filter((v: any) => v.status === 'active').length ?? 0

  const totalInvoiced = invoiceStats?.reduce((s, i: any) => s + (i.total_amount || 0), 0) ?? 0
  const totalPaid = invoiceStats?.reduce((s, i: any) => s + (i.paid_amount || 0), 0) ?? 0
  const outstanding = totalInvoiced - totalPaid

  const lowStockCount = stockAlerts?.filter((s: any) => s.current_stock > 0 && s.current_stock <= s.reorder_level).length ?? 0
  const outOfStockCount = stockAlerts?.filter((s: any) => s.current_stock <= 0).length ?? 0

  const centreMap = new Map<string, { code: string; name: string; total: number; count: number }>()
  centreBreakdown?.forEach((po: any) => {
    const code = po.centre?.code || 'Unknown'
    const existing = centreMap.get(code) || { code, name: po.centre?.name || '', total: 0, count: 0 }
    existing.total += po.total_amount || 0
    existing.count += 1
    centreMap.set(code, existing)
  })
  const centreData = Array.from(centreMap.values()).sort((a, b) => b.total - a.total)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Overview of procurement metrics</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card border-l-4 border-[#1B3A6B]">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={18} className="text-[#1B3A6B]" />
            <span className="text-sm text-gray-500">Total POs</span>
          </div>
          <div className="text-2xl font-bold text-[#1B3A6B]">{totalPOs}</div>
          <div className="text-xs text-gray-400 mt-1">{approvedPOs} approved | {pendingPOs} pending</div>
        </div>
        <div className="stat-card border-l-4 border-[#0D7E8A]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-[#0D7E8A]" />
            <span className="text-sm text-gray-500">Total PO Value</span>
          </div>
          <div className="text-2xl font-bold text-[#0D7E8A]">{formatLakhs(totalPOValue)}</div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <Users size={18} className="text-green-500" />
            <span className="text-sm text-gray-500">Active Vendors</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{activeVendors}</div>
          <div className="text-xs text-gray-400 mt-1">{totalVendors} total registered</div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm text-gray-500">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(outstanding)}</div>
          <div className="text-xs text-gray-400 mt-1">{formatLakhs(totalPaid)} paid</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Centre */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#0D7E8A]" />
            <h2 className="font-semibold text-gray-900">Spend by Centre</h2>
          </div>
          {centreData.length > 0 ? (
            <div className="p-5 space-y-4">
              {centreData.map(c => {
                const maxTotal = centreData[0]?.total || 1
                const pct = Math.round((c.total / maxTotal) * 100)
                return (
                  <div key={c.code}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{c.code} — {c.name}</span>
                      <span className="font-semibold text-[#1B3A6B]">{formatLakhs(c.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-[#0D7E8A] h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.count} POs</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package size={16} className="text-[#0D7E8A]" />
            <h2 className="font-semibold text-gray-900">Stock Health</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-100">
              <div>
                <div className="text-sm font-semibold text-red-700">Out of Stock</div>
                <div className="text-xs text-red-500">Items needing immediate reorder</div>
              </div>
              <div className="text-3xl font-bold text-red-600">{outOfStockCount}</div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-100">
              <div>
                <div className="text-sm font-semibold text-yellow-700">Low Stock</div>
                <div className="text-xs text-yellow-500">Items below reorder level</div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{lowStockCount}</div>
            </div>
            <Link href="/items/stock" className="block text-center text-sm text-[#0D7E8A] hover:underline font-medium pt-2">
              View All Stock Levels
            </Link>
          </div>
        </div>

        {/* Quick Links & Exports */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Reports</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Link href="/finance/credit" className="p-4 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center">
              <div className="text-sm font-medium text-gray-700">Aging Report</div>
              <div className="text-xs text-gray-400 mt-1">Credit period analysis</div>
            </Link>
            <Link href="/finance/invoices?payment_status=unpaid" className="p-4 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center">
              <div className="text-sm font-medium text-gray-700">Unpaid Invoices</div>
              <div className="text-xs text-gray-400 mt-1">All outstanding</div>
            </Link>
            <Link href="/purchase-orders?status=pending_approval" className="p-4 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center">
              <div className="text-sm font-medium text-gray-700">Pending POs</div>
              <div className="text-xs text-gray-400 mt-1">Awaiting approval</div>
            </Link>
            <Link href="/items/stock?status=low" className="p-4 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center">
              <div className="text-sm font-medium text-gray-700">Low Stock</div>
              <div className="text-xs text-gray-400 mt-1">Below reorder level</div>
            </Link>
          </div>

          <h2 className="font-semibold text-gray-900 mb-3">Export Data (CSV)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/api/export?type=purchase_orders" className="p-3 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center flex items-center justify-center gap-2">
              <Download size={14} className="text-[#0D7E8A]" />
              <span className="text-sm font-medium text-gray-700">POs</span>
            </a>
            <a href="/api/export?type=invoices" className="p-3 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center flex items-center justify-center gap-2">
              <Download size={14} className="text-[#0D7E8A]" />
              <span className="text-sm font-medium text-gray-700">Invoices</span>
            </a>
            <a href="/api/export?type=vendors" className="p-3 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center flex items-center justify-center gap-2">
              <Download size={14} className="text-[#0D7E8A]" />
              <span className="text-sm font-medium text-gray-700">Vendors</span>
            </a>
            <a href="/api/export?type=stock" className="p-3 rounded-lg border border-gray-200 hover:border-[#0D7E8A] hover:bg-blue-50 transition-colors text-center flex items-center justify-center gap-2">
              <Download size={14} className="text-[#0D7E8A]" />
              <span className="text-sm font-medium text-gray-700">Stock</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
