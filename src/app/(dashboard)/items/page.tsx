import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus, Package, Search } from 'lucide-react'
import ItemListClient from './ItemListClient'

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; alert?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, category:item_categories(name, code)')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('item_code', { ascending: true })

  if (params.q) query = query.ilike('generic_name', `%${params.q}%`)
  if (params.category) query = query.eq('category_id', params.category)

  const { data: items, count } = await query.limit(100)

  const { data: categories } = await supabase
    .from('item_categories')
    .select('id, name, code')
    .is('parent_id', null)
    .eq('is_active', true)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Item Master</h1>
          <p className="page-subtitle">{count ?? 0} active SKUs</p>
        </div>
        <Link href="/items/new" className="btn-primary">
          <Plus size={16} /> Add Item
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex gap-4 flex-wrap">
        <form className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            name="q"
            placeholder="Search item name or code..."
            defaultValue={params.q}
            className="form-input pl-10"
            aria-label="Search items by name or code"
          />
        </form>
        <select className="form-select w-52" defaultValue={params.category}>
          <option value="">All Categories</option>
          {categories?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {items && items.length > 0 ? (
          <ItemListClient items={items} categories={categories || []} />
        ) : (
          <div className="empty-state">
            <Package size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No items found</p>
            <p className="text-sm text-gray-400 mt-1">
              {params.q || params.category ? 'Try adjusting your search' : 'Start building your item master'}
            </p>
            {!params.q && !params.category && (
              <Link href="/items/new" className="btn-primary mt-4">
                <Plus size={15} /> Add First Item
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
