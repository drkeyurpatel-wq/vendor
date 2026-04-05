import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { Package, Plus, Truck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DEP_STATUS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', partially_used: 'bg-blue-100 text-blue-700',
  fully_used: 'bg-gray-100 text-gray-500', returned: 'bg-orange-100 text-orange-700',
}

export default async function DepositsListPage() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: deposits } = await supabase.from('consignment_deposits')
    .select('*, vendor:vendors(legal_name, vendor_code), centre:centres(code, name)')
    .order('challan_date', { ascending: false }).limit(200)

  // Get item counts per deposit
  const depIds = (deposits || []).map(d => d.id)
  let itemCounts: Record<string, { total: number; available: number }> = {}
  if (depIds.length > 0) {
    const { data: stocks } = await supabase.from('consignment_stock')
      .select('deposit_id, qty_deposited, qty_available').in('deposit_id', depIds)
    stocks?.forEach(s => {
      if (!itemCounts[s.deposit_id]) itemCounts[s.deposit_id] = { total: 0, available: 0 }
      itemCounts[s.deposit_id].total += s.qty_deposited || 0
      itemCounts[s.deposit_id].available += s.qty_available || 0
    })
  }

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><Package size={14} /> Back</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Deposits</h1>
          <p className="page-subtitle">{deposits?.length ?? 0} vendor challans received</p>
        </div>
        <Link href="/consignment/deposits/new" className="btn-primary text-sm"><Truck size={14} /> Receive Challan</Link>
      </div>

      <div className="card overflow-hidden">
        {(deposits?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Deposit #</th><th>Vendor</th><th>Centre</th><th>Challan</th><th>Date</th>
                <th>Items</th><th>Available</th><th>Status</th>
              </tr></thead>
              <tbody>
                {deposits!.map((d: any) => {
                  const counts = itemCounts[d.id] || { total: 0, available: 0 }
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td><Link href={`/consignment/deposits/${d.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{d.deposit_number}</Link></td>
                      <td className="text-sm text-gray-900">{d.vendor?.legal_name}</td>
                      <td><span className="badge bg-blue-50 text-blue-700 text-[10px]">{d.centre?.code}</span></td>
                      <td className="font-mono text-xs text-gray-600">{d.challan_number}</td>
                      <td className="text-sm text-gray-600">{formatDate(d.challan_date)}</td>
                      <td className="text-sm font-semibold">{counts.total}</td>
                      <td className="text-sm font-bold text-navy-600">{counts.available}</td>
                      <td><span className={cn('badge', DEP_STATUS[d.status] || 'bg-gray-100 text-gray-600')}>{d.status?.replace(/_/g, ' ')}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <Truck size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No deposits yet</p>
            <p className="text-sm text-gray-500 mt-1"><Link href="/consignment/deposits/new" className="text-teal-600 hover:underline">Receive first challan</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}
