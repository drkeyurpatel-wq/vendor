import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { Package, ArrowRight, AlertTriangle, Clock, CheckCircle2, Truck, Heart, Bone, Cpu, Scissors } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  cardiac_stent: { label: 'Cardiac Stents', icon: Heart, color: 'text-red-600 bg-red-50' },
  ortho_implant: { label: 'Ortho Implants', icon: Bone, color: 'text-blue-600 bg-blue-50' },
  pacemaker: { label: 'Pacemakers', icon: Cpu, color: 'text-purple-600 bg-purple-50' },
  surgical_consumable: { label: 'Surgical Consumables', icon: Scissors, color: 'text-teal-600 bg-teal-50' },
  other: { label: 'Other', icon: Package, color: 'text-gray-600 bg-gray-50' },
}

export default async function ConsignmentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: allStock },
    { data: pendingUsage, count: pendingCount },
    { data: recentUsage },
    { data: deposits },
  ] = await Promise.all([
    supabase.from('consignment_stock').select('category, qty_available, vendor_rate, status, expiry_date'),
    supabase.from('consignment_usage').select('*', { count: 'exact', head: true }).eq('conversion_status', 'pending'),
    supabase.from('consignment_usage').select('*, stock:consignment_stock(item_description, category, serial_number)').order('procedure_date', { ascending: false }).limit(10),
    supabase.from('consignment_deposits').select('id, deposit_number, vendor:vendors(legal_name), status, challan_date').order('challan_date', { ascending: false }).limit(5),
  ])

  const stock = allStock || []
  const availableStock = stock.filter(s => s.status === 'available' && s.qty_available > 0)
  const totalValue = availableStock.reduce((s, i) => s + (i.qty_available * (i.vendor_rate || 0)), 0)
  const totalItems = availableStock.reduce((s, i) => s + i.qty_available, 0)

  // Expiring within 90 days
  const today = new Date()
  const expiring = availableStock.filter(s => {
    if (!s.expiry_date) return false
    const d = new Date(s.expiry_date)
    return d.getTime() - today.getTime() < 90 * 24 * 60 * 60 * 1000
  })

  // Category breakdown
  const catStats = Object.entries(CATEGORY_META).map(([key, meta]) => {
    const items = availableStock.filter(s => s.category === key)
    return { key, ...meta, count: items.reduce((s, i) => s + i.qty_available, 0), value: items.reduce((s, i) => s + (i.qty_available * (i.vendor_rate || 0)), 0) }
  }).filter(c => c.count > 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Management</h1>
          <p className="page-subtitle">Vendor-owned inventory held at Health1 — use first, PO later</p>
        </div>
        <div className="flex gap-2">
          <Link href="/consignment/deposits/new" className="btn-primary text-sm"><Truck size={14} /> Receive Challan</Link>
          <Link href="/consignment/usage/new" className="btn-secondary text-sm"><Package size={14} /> Log Usage</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link href="/consignment/stock" className="stat-card hover:shadow-md transition-shadow border-l-4 border-[#1B3A6B]">
          <div className="text-xs text-gray-500">Available Stock</div>
          <div className="text-2xl font-bold text-[#1B3A6B]">{totalItems}</div>
          <div className="text-xs text-gray-400">items across all centres</div>
        </Link>
        <div className="stat-card border-l-4 border-teal-500">
          <div className="text-xs text-gray-500">Consignment Value</div>
          <div className="text-2xl font-bold text-teal-600">{formatCurrency(totalValue)}</div>
          <div className="text-xs text-gray-400">vendor-owned at hospital</div>
        </div>
        <Link href="/consignment/usage" className="stat-card hover:shadow-md transition-shadow border-l-4 border-orange-500">
          <div className="text-xs text-gray-500">Pending Conversion</div>
          <div className="text-2xl font-bold text-orange-600">{pendingCount ?? 0}</div>
          <div className="text-xs text-gray-400">used, awaiting PO</div>
        </Link>
        <div className="stat-card border-l-4 border-red-500">
          <div className="text-xs text-gray-500">Expiring (90d)</div>
          <div className="text-2xl font-bold text-red-600">{expiring.length}</div>
          <div className="text-xs text-gray-400">return or use soon</div>
        </div>
      </div>

      {/* Category Breakdown */}
      {catStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {catStats.map(cat => {
            const Icon = cat.icon
            return (
              <div key={cat.key} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cat.color)}><Icon size={16} /></div>
                  <span className="text-sm font-semibold text-gray-900">{cat.label}</span>
                </div>
                <div className="text-lg font-bold text-[#1B3A6B]">{cat.count} <span className="text-xs font-normal text-gray-400">items</span></div>
                <div className="text-xs text-gray-500">{formatCurrency(cat.value)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Usage */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-[#1B3A6B]">Recent Usage</h3>
            <Link href="/consignment/usage" className="text-xs text-teal-600 hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {(recentUsage?.length ?? 0) > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentUsage!.map((u: any) => (
                <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', u.conversion_status === 'completed' ? 'bg-green-50' : 'bg-yellow-50')}>
                    {u.conversion_status === 'completed' ? <CheckCircle2 size={14} className="text-green-500" /> : <Clock size={14} className="text-yellow-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{u.stock?.item_description || 'Unknown item'}</div>
                    <div className="text-xs text-gray-500">{u.patient_name} • Dr. {u.surgeon_name} • {u.procedure_date}</div>
                  </div>
                  <span className={cn('badge text-[10px]', u.conversion_status === 'completed' ? 'bg-green-100 text-green-700' : u.conversion_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
                    {u.conversion_status?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">No usage logged yet</div>
          )}
        </div>

        {/* Recent Deposits */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-[#1B3A6B]">Recent Deposits</h3>
            <Link href="/consignment/deposits" className="text-xs text-teal-600 hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {(deposits?.length ?? 0) > 0 ? (
            <div className="divide-y divide-gray-50">
              {deposits!.map((d: any) => (
                <Link key={d.id} href={`/consignment/deposits/${d.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 block">
                  <div>
                    <div className="text-sm font-mono font-semibold text-[#1B3A6B]">{d.deposit_number}</div>
                    <div className="text-xs text-gray-500">{d.vendor?.legal_name} • {d.challan_date}</div>
                  </div>
                  <span className={cn('badge', d.status === 'active' ? 'bg-green-100 text-green-700' : d.status === 'fully_used' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700')}>
                    {d.status?.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-400">No deposits received yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
