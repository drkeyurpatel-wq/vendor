import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Package, AlertTriangle, Heart, Bone, Cpu, Scissors } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CAT_ICONS: Record<string, any> = { cardiac_stent: Heart, ortho_implant: Bone, pacemaker: Cpu, surgical_consumable: Scissors, other: Package }
const CAT_COLORS: Record<string, string> = { cardiac_stent: 'text-red-600', ortho_implant: 'text-blue-600', pacemaker: 'text-purple-600', surgical_consumable: 'text-teal-600', other: 'text-gray-500' }

export default async function ConsignmentStockPage({ searchParams }: { searchParams: Promise<{ category?: string; centre?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase.from('consignment_stock')
    .select('*, deposit:consignment_deposits(deposit_number, vendor:vendors(legal_name, vendor_code), centre:centres(code, name), challan_number)')
    .eq('status', 'available')
    .gt('qty_available', 0)
    .order('expiry_date', { ascending: true })

  if (params.category) query = query.eq('category', params.category)

  const { data: stock } = await query.limit(500)
  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')

  const items = (stock || []).filter(s => {
    if (params.centre) return s.deposit?.centre?.code === params.centre
    return true
  })

  const totalValue = items.reduce((s, i) => s + ((i.qty_available ?? 0) * (i.vendor_rate || 0)), 0)
  const today = new Date()

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <Package size={14} /> Back to Consignment
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Stock</h1>
          <p className="page-subtitle">{items.length} items — {formatCurrency(totalValue)} vendor-owned at Health1</p>
        </div>
        <Link href="/consignment/usage/new" className="btn-primary text-sm">Log Usage</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href="/consignment/stock" className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', !params.category ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-500 border-gray-200')}>All</Link>
        {['cardiac_stent', 'ortho_implant', 'pacemaker', 'surgical_consumable'].map(cat => (
          <Link key={cat} href={`/consignment/stock?category=${cat}${params.centre ? `&centre=${params.centre}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', params.category === cat ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-500 border-gray-200')}>
            {cat.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>
      {centres && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {centres.map(c => (
            <Link key={c.id} href={`/consignment/stock?${params.category ? `category=${params.category}&` : ''}centre=${c.code}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border', params.centre === c.code ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Item</th><th>Vendor</th><th>Centre</th><th>Serial/Batch</th>
                  <th>Expiry</th><th>Size</th><th className="text-right">Rate</th>
                  <th className="text-right">Avail</th><th>Challan</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  const Icon = CAT_ICONS[item.category] || Package
                  const daysToExpiry = item.expiry_date ? Math.ceil((new Date(item.expiry_date).getTime() - today.getTime()) / (1000*60*60*24)) : null
                  const expiryAlert = daysToExpiry !== null && daysToExpiry < 90
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="text-xs text-gray-400">{idx + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={cn(CAT_COLORS[item.category])} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.item_description}</div>
                            {item.brand && <div className="text-xs text-gray-400">{item.brand} {item.model_number || ''}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-gray-600">{item.deposit?.vendor?.legal_name}</td>
                      <td><span className="badge bg-blue-50 text-blue-700 text-[10px]">{item.deposit?.centre?.code}</span></td>
                      <td className="font-mono text-xs">{item.serial_number || item.batch_number || '—'}</td>
                      <td>
                        {item.expiry_date ? (
                          <span className={cn('text-xs', expiryAlert ? 'text-red-600 font-semibold' : 'text-gray-600')}>
                            {formatDate(item.expiry_date)}
                            {expiryAlert && <AlertTriangle size={10} className="inline ml-1 text-red-500" />}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="text-xs text-gray-600">{item.size_spec || '—'}</td>
                      <td className="text-sm text-right font-mono">{formatCurrency(item.vendor_rate)}</td>
                      <td className="text-sm text-right font-bold text-[#1B3A6B]">{item.qty_available}</td>
                      <td className="font-mono text-xs text-gray-500">{item.deposit?.challan_number}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <Package size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No consignment stock</p>
            <p className="text-sm text-gray-400 mt-1"><Link href="/consignment/deposits/new" className="text-teal-600 hover:underline">Receive a challan</Link> to add items</p>
          </div>
        )}
      </div>
    </div>
  )
}
