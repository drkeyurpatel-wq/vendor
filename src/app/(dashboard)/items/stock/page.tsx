import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Layers } from 'lucide-react'
import StockListClient from './StockListClient'
import AutoReorderPanel from '@/components/ui/AutoReorderPanel'

export const dynamic = 'force-dynamic'

export default async function StockLevelsPage({
  searchParams,
}: {
  searchParams: Promise<{ centre?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles').select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id).single()

  let query = supabase
    .from('item_centre_stock')
    .select('*, item:items(item_code, generic_name, unit, category:item_categories(name)), centre:centres(code, name)', { count: 'exact' })
    .order('current_stock', { ascending: true })

  if (params.centre) query = query.eq('centre_id', params.centre)
  else if (profile?.centre_id && !['group_admin', 'group_cao'].includes(profile?.role || '')) {
    query = query.eq('centre_id', profile.centre_id)
  }

  if (params.status === 'out') query = query.lte('current_stock', 0).gt('reorder_level', 0)
  else if (params.status === 'low') query = query.gt('current_stock', 0).filter('current_stock', 'lte', 'reorder_level')

  const { data: stocks, count } = await query.limit(500)
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true).order('code')

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Stock Levels</h1>
          <p className="text-sm text-gray-500 mt-1">{(count ?? 0).toLocaleString('en-IN')} stock entries across centres</p>
        </div>
      </div>

      {/* Stock status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap" role="tablist">
        <Link href="/items/stock" role="tab" aria-selected={!params.status}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all',
            !params.status ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        <Link href="/items/stock?status=out" role="tab" aria-selected={params.status === 'out'}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all',
            params.status === 'out' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-gray-200 hover:bg-red-50')}>
          Out of Stock
        </Link>
        <Link href="/items/stock?status=low" role="tab" aria-selected={params.status === 'low'}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all',
            params.status === 'low' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-white text-yellow-600 border-gray-200 hover:bg-yellow-50')}>
          Low Stock
        </Link>
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <Link href={`/items/stock${params.status ? `?status=${params.status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              !params.centre ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
            All Centres
          </Link>
          {centres?.map(c => (
            <Link key={c.id} href={`/items/stock?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      {/* Auto-Reorder (admin/purchase manager only) */}
      {profile?.role && ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(profile.role) && (
        <div className="mb-6">
          <AutoReorderPanel />
        </div>
      )}

      <StockListClient stocks={stocks ?? []} userRole={profile?.role || 'store_staff'} />
    </div>
  )
}
