import { requireAuth } from '@/lib/auth'
import ItemCategoriesManager from './ItemCategoriesManager'

export default async function ItemCategoriesPage() {
  const { supabase, role, isGroupLevel } = await requireAuth()

  const { data: categories } = await supabase
    .from('item_categories')
    .select('id, name, code, parent_id, is_active')
    .order('name')

  // Get item count per category
  const { data: itemCounts } = await supabase
    .from('items')
    .select('category_id')
    .is('deleted_at', null)

  const countMap: Record<string, number> = {}
  itemCounts?.forEach(i => {
    if (i.category_id) {
      countMap[i.category_id] = (countMap[i.category_id] ?? 0) + 1
    }
  })

  return <ItemCategoriesManager initialCategories={categories ?? []} itemCountMap={countMap} />
}
