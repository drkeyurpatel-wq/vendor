import { createClient } from '@/lib/supabase/server'
import VendorCategoriesManager from './VendorCategoriesManager'

export default async function VendorCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('id, name, code, description, is_active')
    .order('name')

  // Get vendor count per category
  const { data: vendorCounts } = await supabase
    .from('vendors')
    .select('category_id')
    .is('deleted_at', null)

  const countMap: Record<string, number> = {}
  vendorCounts?.forEach(v => {
    if (v.category_id) {
      countMap[v.category_id] = (countMap[v.category_id] ?? 0) + 1
    }
  })

  return <VendorCategoriesManager initialCategories={categories ?? []} vendorCountMap={countMap} />
}
