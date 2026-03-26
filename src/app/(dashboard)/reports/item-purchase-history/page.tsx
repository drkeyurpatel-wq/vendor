import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, formatLakhs } from '@/lib/utils'
import { ArrowLeft, Package, Search, TrendingDown, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ItemPurchaseHistory({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; months?: string }>
}) {
  const params = await searchParams
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const monthsBack = parseInt(params.months || '6') || 6
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1).toISOString().split('T')[0]

  // Get PO items with parent PO and item details
  // Note: Supabase JS join filters are unreliable — fetch all and filter in JS
  const { data: poItems } = await supabase
    .from('purchase_order_items')
    .select('ordered_qty, rate, total_amount, item:items(id, item_code, generic_name, unit), po:purchase_orders(po_date, status, deleted_at, centre:centres(code))')
    .order('created_at', { ascending: false })
    .limit(5000)

  // Filter to valid POs and date range in JS (reliable)
  const validItems = (poItems || []).filter((pi: any) => {
    if (!pi.item || !pi.po) return false
    if (pi.po.status === 'cancelled') return false
    if (pi.po.deleted_at) return false
    if (pi.po.po_date < startDate) return false
    return true
  })

  // If searching, filter by item match
  let filteredItems = validItems
  if (params.q) {
    const q = params.q.toLowerCase()
    filteredItems = validItems.filter((pi: any) =>
      pi.item.generic_name?.toLowerCase().includes(q) ||
      pi.item.item_code?.toLowerCase().includes(q)
    )
  }

  // Group by item
  const itemMap = new Map<string, {
    item: any; totalQty: number; totalValue: number; orderCount: number;
    avgRate: number; minRate: number; maxRate: number; lastOrderDate: string;
    centres: Set<string>; monthlyQty: Record<string, number>
  }>()

  ;(filteredItems).forEach((pi: any) => {
    const poDate = pi.po.po_date

    const key = pi.item.id
    if (!itemMap.has(key)) {
      itemMap.set(key, {
        item: pi.item, totalQty: 0, totalValue: 0, orderCount: 0,
        avgRate: 0, minRate: Infinity, maxRate: 0, lastOrderDate: '',
        centres: new Set(), monthlyQty: {}
      })
    }
    const g = itemMap.get(key)!
    const qty = pi.ordered_qty || 0
    const rate = pi.rate || 0
    g.totalQty += qty
    g.totalValue += pi.total_amount || (qty * rate)
    g.orderCount++
    if (rate > 0) { g.minRate = Math.min(g.minRate, rate); g.maxRate = Math.max(g.maxRate, rate) }
    if (poDate > g.lastOrderDate) g.lastOrderDate = poDate
    if (pi.po.centre?.code) g.centres.add(pi.po.centre.code)
    const monthKey = poDate.substring(0, 7)
    g.monthlyQty[monthKey] = (g.monthlyQty[monthKey] || 0) + qty
  })

  // Compute averages
  const items = Array.from(itemMap.values()).map(g => {
    g.avgRate = g.totalQty > 0 ? g.totalValue / g.totalQty : 0
    if (g.minRate === Infinity) g.minRate = 0
    return g
  }).sort((a, b) => b.totalValue - a.totalValue)

  const totalSpend = items.reduce((s, i) => s + i.totalValue, 0)

  return (
    <div>
      <Link href="/reports" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Item Purchase History</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} items — {formatLakhs(totalSpend)} total spend — last {monthsBack} months</p>
        </div>
        <div className="flex gap-2">
          {[3, 6, 12].map(m => (
            <Link key={m} href={`/reports/item-purchase-history?months=${m}${params.q ? `&q=${params.q}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                monthsBack === m ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
              {m}mo
            </Link>
          ))}
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="mb-6 flex gap-2 max-w-md">
        <input type="hidden" name="months" value={monthsBack} />
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input name="q" defaultValue={params.q} placeholder="Search item name, code..."
            className="form-input pl-9 text-sm w-full" />
        </div>
        <button type="submit" className="btn-primary text-sm">Search</button>
        {params.q && <Link href={`/reports/item-purchase-history?months=${monthsBack}`} className="btn-secondary text-sm">Clear</Link>}
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th><th>Name</th><th>Unit</th>
                  <th className="text-right">Total Qty</th><th className="text-right">Total Value</th>
                  <th className="text-right">Avg Rate</th><th className="text-right">Rate Range</th>
                  <th>Orders</th><th>Centres</th><th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 200).map(g => {
                  const rateVariation = g.maxRate > 0 && g.minRate > 0 ? ((g.maxRate - g.minRate) / g.minRate * 100) : 0
                  return (
                    <tr key={g.item.id}>
                      <td><Link href={`/items/${g.item.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{g.item.item_code}</Link></td>
                      <td className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{g.item.generic_name}</td>
                      <td className="text-xs text-gray-500">{g.item.unit}</td>
                      <td className="text-sm text-right font-semibold">{g.totalQty.toLocaleString('en-IN')}</td>
                      <td className="text-sm text-right font-bold text-navy-600">{formatLakhs(g.totalValue)}</td>
                      <td className="text-sm text-right font-mono">{formatCurrency(g.avgRate)}</td>
                      <td className="text-sm text-right">
                        <span className="font-mono text-xs text-gray-600">{formatCurrency(g.minRate)} — {formatCurrency(g.maxRate)}</span>
                        {rateVariation > 20 && (
                          <span className="ml-1 text-[10px] text-red-500 font-medium" title="Rate variation >20%">⚠ {rateVariation.toFixed(0)}%</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-700">{g.orderCount}</td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from(g.centres).map(c => <span key={c} className="badge bg-blue-50 text-blue-700 text-[10px]">{c}</span>)}
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">{formatDate(g.lastOrderDate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><Package size={40} className="mb-3 text-gray-500" /><p className="font-medium text-gray-500">No purchase data found</p></div>
        )}
      </div>
    </div>
  )
}
