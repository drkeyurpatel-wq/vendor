import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus, Package } from 'lucide-react'

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
        <div className="flex-1 min-w-48 relative">
          <input
            placeholder="Search item name or code..."
            defaultValue={params.q}
            className="form-input pl-4"
          />
        </div>
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
          <div className="overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">List of items with code, name, brand, category, unit, HSN code, GST percentage, and flags</caption>
              <thead>
                <tr>
                  <th scope="col">Item Code</th>
                  <th scope="col">Generic Name</th>
                  <th scope="col">Brand</th>
                  <th scope="col">Category</th>
                  <th scope="col">Unit</th>
                  <th scope="col">HSN</th>
                  <th scope="col">GST %</th>
                  <th scope="col">Flags</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {item.item_code}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{item.generic_name}</div>
                    </td>
                    <td className="text-sm text-gray-600">{item.brand_name ?? '—'}</td>
                    <td className="text-sm text-gray-600">{item.category?.name ?? '—'}</td>
                    <td className="text-sm text-gray-600">{item.unit}</td>
                    <td className="text-xs font-mono text-gray-500">{item.hsn_code ?? '—'}</td>
                    <td className="text-sm text-gray-600">{item.gst_percent}%</td>
                    <td>
                      <div className="flex gap-1">
                        {item.is_narcotic && <span className="badge bg-red-100 text-red-700">Narcotic</span>}
                        {item.is_high_alert && <span className="badge bg-orange-100 text-orange-700">High Alert</span>}
                        {item.is_cold_chain && <span className="badge bg-blue-100 text-blue-700">Cold Chain</span>}
                      </div>
                    </td>
                    <td>
                      <Link href={`/items/${item.id}`} className="text-xs text-[#0D7E8A] hover:underline font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
