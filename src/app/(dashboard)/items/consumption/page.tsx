import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ConsumptionPage({
  searchParams,
}: {
  searchParams: Promise<{ centre?: string; months?: string }>
}) {
  const params = await searchParams
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const monthsBack = parseInt(params.months || '3') || 3
  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')

  const { data: grnData } = await supabase
    .from('grn_items')
    .select('item_id, accepted_qty, rate, total_amount, grn:grns(grn_date, centre_id, centre:centres(code))')
    .order('id').limit(5000)

  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).toISOString().split('T')[0]

  const itemMap = new Map<string, { item_id: string; totalQty: number; totalValue: number; monthlyQty: Record<string, number>; centres: Set<string> }>()

  ;(grnData || []).forEach((gi: any) => {
    if (!gi.grn?.grn_date || gi.grn.grn_date < cutoff) return
    if (params.centre && gi.grn.centre_id !== params.centre) return
    const key = gi.item_id
    if (!itemMap.has(key)) itemMap.set(key, { item_id: key, totalQty: 0, totalValue: 0, monthlyQty: {}, centres: new Set() })
    const g = itemMap.get(key)!
    g.totalQty += gi.accepted_qty || 0
    g.totalValue += gi.total_amount || 0
    const mk = gi.grn.grn_date.substring(0, 7)
    g.monthlyQty[mk] = (g.monthlyQty[mk] || 0) + (gi.accepted_qty || 0)
    if (gi.grn.centre?.code) g.centres.add(gi.grn.centre.code)
  })

  const itemIds = Array.from(itemMap.keys())
  const itemNames: Record<string, { code: string; name: string; unit: string }> = {}
  if (itemIds.length > 0) {
    const { data: items } = await supabase.from('items').select('id, item_code, generic_name, unit').in('id', itemIds)
    items?.forEach((i: any) => { itemNames[i.id] = { code: i.item_code, name: i.generic_name, unit: i.unit || 'Nos' } })
  }

  const sortedItems = Array.from(itemMap.values()).sort((a, b) => b.totalValue - a.totalValue)
  const totalValue = sortedItems.reduce((s, i) => s + i.totalValue, 0)

  const monthHeaders: string[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthHeaders.push(d.toISOString().substring(0, 7))
  }

  return (
    <div>
      <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back to Items</Link>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600">Consumption Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">{sortedItems.length} items — {formatCurrency(totalValue)} total — last {monthsBack} months (from GRN data)</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/items/consumption/upload" className="btn-primary text-sm">
            Upload Consumption
          </Link>
          {[3, 6, 12].map(m => (
            <Link key={m} href={`/items/consumption?months=${m}${params.centre ? `&centre=${params.centre}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                monthsBack === m ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200')}>
              {m}mo
            </Link>
          ))}
        </div>
      </div>

      {centres && centres.length > 0 && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <Link href={`/items/consumption?months=${monthsBack}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              !params.centre ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-500 border-gray-200')}>
            All Centres
          </Link>
          {centres.map(c => (
            <Link key={c.id} href={`/items/consumption?months=${monthsBack}&centre=${c.id}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        {sortedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Unit</th>
                  {monthHeaders.map(m => <th key={m} className="text-right">{m.substring(5)}/{m.substring(2, 4)}</th>)}
                  <th className="text-right">Total</th>
                  <th className="text-right">Avg/Mo</th>
                  <th className="text-right">Value</th>
                  <th>Centres</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, idx) => {
                  const info = itemNames[item.item_id] || { code: '—', name: 'Unknown', unit: '' }
                  const months = Object.keys(item.monthlyQty).length || 1
                  return (
                    <tr key={item.item_id} className="hover:bg-gray-50">
                      <td className="text-xs text-gray-500">{idx + 1}</td>
                      <td>
                        <Link href={`/items/${item.item_id}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">{info.name}</Link>
                        <div className="text-xs text-gray-500 font-mono">{info.code}</div>
                      </td>
                      <td className="text-xs text-gray-500">{info.unit}</td>
                      {monthHeaders.map((m, mi) => {
                        const qty = item.monthlyQty[m] || 0
                        const prev = mi > 0 ? (item.monthlyQty[monthHeaders[mi - 1]] || 0) : 0
                        const trend = prev > 0 ? ((qty - prev) / prev) : 0
                        return (
                          <td key={m} className="text-sm text-right font-mono">
                            {qty > 0 ? qty.toLocaleString('en-IN') : <span className="text-gray-500">—</span>}
                            {qty > 0 && Math.abs(trend) > 0.2 && (
                              <span className={cn('ml-1 text-[10px]', trend > 0 ? 'text-red-500' : 'text-green-500')}>
                                {trend > 0 ? '↑' : '↓'}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-sm text-right font-semibold text-navy-600">{item.totalQty.toLocaleString('en-IN')}</td>
                      <td className="text-sm text-right font-mono text-gray-600">{Math.round(item.totalQty / months).toLocaleString('en-IN')}</td>
                      <td className="text-sm text-right font-semibold">{formatCurrency(item.totalValue)}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from(item.centres).map(c => <span key={c} className="badge bg-blue-50 text-blue-700 text-[10px]">{c}</span>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-navy-50">
                  <td colSpan={3} className="font-semibold text-navy-600">Total</td>
                  {monthHeaders.map(m => <td key={m} className="text-right font-bold text-navy-600">{sortedItems.reduce((s, i) => s + (i.monthlyQty[m] || 0), 0).toLocaleString('en-IN')}</td>)}
                  <td className="text-right font-bold text-navy-600">{sortedItems.reduce((s, i) => s + i.totalQty, 0).toLocaleString('en-IN')}</td>
                  <td></td>
                  <td className="text-right font-bold text-navy-600">{formatCurrency(totalValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <Package size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No consumption data found</p>
            <p className="text-sm text-gray-500 mt-1">Consumption is calculated from GRN accepted quantities</p>
          </div>
        )}
      </div>
    </div>
  )
}
