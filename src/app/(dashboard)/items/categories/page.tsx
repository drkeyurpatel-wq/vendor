import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FolderTree, ChevronRight } from 'lucide-react'
import ItemCategoryFormModal from './ItemCategoryFormModal'

export default async function ItemCategoriesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('item_categories')
    .select('*')
    .order('code')

  // Get item count per category
  const { data: itemCounts } = await supabase
    .from('items')
    .select('category_id')
    .is('deleted_at', null)

  const countMap = new Map<string, number>()
  itemCounts?.forEach(i => {
    if (i.category_id) {
      countMap.set(i.category_id, (countMap.get(i.category_id) ?? 0) + 1)
    }
  })

  const parentCategories = categories?.filter(c => !c.parent_id) ?? []
  const subCategories = categories?.filter(c => c.parent_id) ?? []
  const activeCount = categories?.filter(c => c.is_active).length ?? 0
  const totalItems = itemCounts?.length ?? 0

  // Build parent lookup for subcategories
  const parentMap = new Map<string, typeof parentCategories>()
  subCategories.forEach(sub => {
    if (sub.parent_id) {
      const existing = parentMap.get(sub.parent_id) || []
      existing.push(sub)
      parentMap.set(sub.parent_id, existing)
    }
  })

  // All categories that are parents (for the form dropdown)
  const allParents = parentCategories.map(c => ({ id: c.id, name: c.name, code: c.code }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Item Categories</h1>
          <p className="page-subtitle">
            {categories?.length ?? 0} categories ({activeCount} active) covering {totalItems} items
          </p>
        </div>
        <ItemCategoryFormModal parentCategories={allParents} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Categories</div>
          <div className="text-2xl font-bold text-[#1B3A6B] mt-1">{categories?.length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Parent Categories</div>
          <div className="text-2xl font-bold text-[#0D7E8A] mt-1">{parentCategories.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Sub-Categories</div>
          <div className="text-2xl font-bold text-[#1B3A6B] mt-1">{subCategories.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{activeCount}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {categories && categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parentCategories.map((cat: any) => {
                  const children = parentMap.get(cat.id) || []
                  return (
                    <>
                      <tr key={cat.id} className="bg-gray-50/50">
                        <td>
                          <span className="font-mono text-xs bg-[#EEF2F9] text-[#1B3A6B] px-2 py-0.5 rounded font-semibold">
                            {cat.code}
                          </span>
                        </td>
                        <td className="font-semibold text-[#1B3A6B]">{cat.name}</td>
                        <td>
                          <span className="badge bg-[#EEF2F9] text-[#1B3A6B]">Parent</span>
                        </td>
                        <td>
                          <span className={cn(
                            'badge',
                            cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          )}>
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm font-semibold text-[#1B3A6B]">
                            {countMap.get(cat.id) ?? 0}
                          </span>
                        </td>
                        <td>
                          <ItemCategoryFormModal parentCategories={allParents} editCategory={cat} />
                        </td>
                      </tr>
                      {children.map((sub: any) => (
                        <tr key={sub.id}>
                          <td>
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {sub.code}
                            </span>
                          </td>
                          <td className="text-gray-700">
                            <span className="inline-flex items-center gap-1 pl-4">
                              <ChevronRight size={12} className="text-gray-400" />
                              {sub.name}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-[#E6F5F6] text-[#0D7E8A]">Sub</span>
                          </td>
                          <td>
                            <span className={cn(
                              'badge',
                              sub.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            )}>
                              {sub.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm font-semibold text-[#1B3A6B]">
                              {countMap.get(sub.id) ?? 0}
                            </span>
                          </td>
                          <td>
                            <ItemCategoryFormModal parentCategories={allParents} editCategory={sub} />
                          </td>
                        </tr>
                      ))}
                    </>
                  )
                })}
                {/* Orphan subcategories (parent_id set but parent doesn't exist as top-level) */}
                {subCategories
                  .filter(s => !parentCategories.find(p => p.id === s.parent_id))
                  .map((cat: any) => (
                    <tr key={cat.id}>
                      <td>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {cat.code}
                        </span>
                      </td>
                      <td className="text-gray-700">{cat.name}</td>
                      <td>
                        <span className="badge bg-yellow-100 text-yellow-700">Orphan</span>
                      </td>
                      <td>
                        <span className={cn(
                          'badge',
                          cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        )}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-semibold text-[#1B3A6B]">
                          {countMap.get(cat.id) ?? 0}
                        </span>
                      </td>
                      <td>
                        <ItemCategoryFormModal parentCategories={allParents} editCategory={cat} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12">
            <div className="empty-state">
              <FolderTree size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No item categories found</p>
              <p className="text-sm text-gray-400 mt-1">
                Add categories to organise your item master
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
