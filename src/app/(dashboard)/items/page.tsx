import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ItemListClient from './ItemListClient'

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, category:item_categories(name, code)', { count: 'exact' })
    .is('deleted_at', null)
    .order('item_code', { ascending: true })

  if (params.q) query = query.or(`generic_name.ilike.%${params.q}%,item_code.ilike.%${params.q}%,brand_name.ilike.%${params.q}%`)
  if (params.category) query = query.eq('category_id', params.category)

  // Fetch up to 500 for client-side table (with server pagination we'd do less)
  const { data: items, count } = await query.limit(500)

  const { data: categories } = await supabase
    .from('item_categories')
    .select('id, name, code, parent_id')
    .eq('is_active', true)
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Item Master</h1>
          <p className="text-sm text-gray-500 mt-1">{(count ?? 0).toLocaleString('en-IN')} SKUs in the system</p>
        </div>
        <Link href="/items/new" className="btn-primary">
          <Plus size={16} /> Add Item
        </Link>
      </div>

      <ItemListClient
        items={items ?? []}
        categories={categories ?? []}
        totalCount={count ?? 0}
      />
    </div>
  )
}
