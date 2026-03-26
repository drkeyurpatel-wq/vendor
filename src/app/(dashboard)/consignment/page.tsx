import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Package, Plus, ArrowRight, AlertTriangle, CheckCircle2, Clock, Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', converted: 'bg-green-100 text-green-700', billed: 'bg-blue-100 text-blue-700',
  active: 'bg-blue-100 text-blue-700', partially_used: 'bg-orange-100 text-orange-800', fully_used: 'bg-green-100 text-green-700', returned: 'bg-gray-100 text-gray-600',
}

export default async function ConsignmentDashboard() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const [{ data: deposits }, { data: stock }, { data: usage }, { count: pendingCount }] = await Promise.all([
    supabase.from('consignment_deposits').select('*, vendor:vendors(legal_name, vendor_code), centre:centres(code)').order('created_at', { ascending: false }).limit(10),
    supabase.from('consignment_stock').select('*, item:items(item_code, generic_name), deposit:consignment_deposits(vendor_id, vendor:vendors(legal_name))').eq('status', 'available').order('created_at', { ascending: false }).limit(20),
    supabase.from('consignment_usage').select('*, stock:consignment_stock(item:items(generic_name, item_code))').order('created_at', { ascending: false }).limit(10),
    supabase.from('consignment_usage').select('*', { count: 'exact', head: true }).eq('conversion_status', 'pending'),
  ])

  const totalStockValue = (stock || []).reduce((s, item) => s + ((item.qty_deposited - item.qty_used - item.qty_returned) * (item.vendor_rate || 0)), 0)
  const availableItems = (stock || []).reduce((s, item) => s + (item.qty_deposited - item.qty_used - item.qty_returned), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Management</h1>
          <p className="page-subtitle">Stents, implants, devices — vendor-owned stock at your hospital</p>
        </div>
        <div className="flex gap-2">
          <Link href="/consignment/usage/new" className="btn-primary text-sm"><Plus size={14} /> Record Usage</Link>
          <Link href="/consignment/deposits/new" className="btn-secondary text-sm"><Truck size={14} /> New Deposit</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-4 border-blue-500">
          <div className="text-xs text-gray-500">Active Deposits</div>
          <div className="text-2xl font-bold text-navy-600">{deposits?.filter(d => d.status === 'active' || d.status === 'partially_used').length || 0}</div>
        </div>
        <div className="stat-card border-l-4 border-teal-500">
          <div className="text-xs text-gray-500">Items Available</div>
          <div className="text-2xl font-bold text-teal-600">{availableItems}</div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="text-xs text-gray-500">Pending Conversion</div>
          <div className="text-2xl font-bold text-orange-600">{pendingCount ?? 0}</div>
        </div>
        <div className="stat-card border-l-4 border-purple-500">
          <div className="text-xs text-gray-500">Stock Value (Vendor-owned)</div>
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalStockValue)}</div>
        </div>
      </div>

      {/* Pending conversions alert */}
      {(pendingCount ?? 0) > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-800">{pendingCount} usage records pending PO/GRN/Invoice conversion</p>
              <p className="text-xs text-orange-600">These items have been used but accounts team hasn't generated the paperwork yet</p>
            </div>
          </div>
          <Link href="/consignment/usage" className="btn-primary text-sm">Convert Now <ArrowRight size={14} /></Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Stock */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy-600">Available Consignment Stock</h2>
            <Link href="/consignment/stock" className="text-xs text-teal-600 hover:underline">View all →</Link>
          </div>
          {stock && stock.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {stock.slice(0, 8).map((s: any) => {
                const avail = s.qty_deposited - s.qty_used - s.qty_returned
                return (
                  <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.item?.generic_name}</div>
                      <div className="text-xs text-gray-500">{s.item?.item_code} | {s.batch_number || 'No batch'} | {s.serial_number || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-navy-600">{avail} avail</div>
                      <div className="text-xs text-gray-500">{formatCurrency(s.vendor_rate)}/unit</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">No available consignment stock</div>
          )}
        </div>

        {/* Recent Usage */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy-600">Recent Usage</h2>
            <Link href="/consignment/usage" className="text-xs text-teal-600 hover:underline">View all →</Link>
          </div>
          {usage && usage.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {usage.map((u: any) => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.patient_name}</div>
                    <div className="text-xs text-gray-500">{u.stock?.item?.generic_name} | {u.surgeon_name || ''} | {formatDate(u.usage_date || u.created_at)}</div>
                  </div>
                  <span className={cn('badge text-xs', STATUS_COLORS[u.conversion_status] || STATUS_COLORS.pending)}>
                    {u.conversion_status === 'converted' ? '✓ Converted' : u.conversion_status === 'billed' ? '✓ Billed' : '⏳ Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500">No usage records yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
