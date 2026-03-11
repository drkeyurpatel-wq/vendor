import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tag } from 'lucide-react'
import VendorCategoryFormModal from './VendorCategoryFormModal'

export default async function VendorCategoriesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('id, name, code, description, is_active')
    .order('name')

  // Get vendor count per category
  const { data: vendorCounts } = await supabase
    .from('vendors')
    .select('category_id')
    .is('deleted_at', null)

  const countMap = new Map<string, number>()
  vendorCounts?.forEach(v => {
    if (v.category_id) {
      countMap.set(v.category_id, (countMap.get(v.category_id) ?? 0) + 1)
    }
  })

  const activeCount = categories?.filter(c => c.is_active).length ?? 0
  const totalVendors = vendorCounts?.length ?? 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Categories</h1>
          <p className="page-subtitle">
            {categories?.length ?? 0} categories ({activeCount} active) covering {totalVendors} vendors
          </p>
        </div>
        <VendorCategoryFormModal />
      </div>

      <div className="card overflow-hidden">
        {categories && categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Vendors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat: any) => (
                  <tr key={cat.id}>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {cat.code}
                      </span>
                    </td>
                    <td className="font-medium text-gray-900">{cat.name}</td>
                    <td className="text-sm text-gray-600 max-w-xs truncate">
                      {cat.description || <span className="text-gray-400">--</span>}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          cat.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-semibold text-[#1B3A6B]">
                        {countMap.get(cat.id) ?? 0}
                      </span>
                    </td>
                    <td>
                      <VendorCategoryFormModal editCategory={cat} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12">
            <div className="empty-state">
              <Tag size={40} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No vendor categories found</p>
              <p className="text-sm text-gray-400 mt-1">
                Click &quot;+ Add Category&quot; above to add your first category
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
