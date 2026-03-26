import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBridge, bridgeSuccess, bridgeError } from '@/lib/bridge-auth'
import { withApiErrorHandler } from '@/lib/api-error-handler'

/**
 * FLOW D: Shared Item/Drug Master Sync
 *
 * GET  — HMIS pulls VPMS item master (full or delta)
 * POST — HMIS pushes new/updated items to VPMS
 *
 * GET params:
 *   ?since=2026-03-01T00:00:00Z  — delta sync (only items updated since)
 *   ?category=DRUG               — filter by category
 *   ?limit=500
 *
 * POST payload (upsert):
 * {
 *   items: [
 *     {
 *       item_code: "H1I-00001",      // Required — VPMS item code
 *       generic_name: "Amoxicillin 500mg",
 *       brand_name: "Moxiforce",
 *       manufacturer: "Mankind",
 *       unit: "Strip",
 *       gst_percent: 12,
 *       hsn_code: "30049099",
 *       category_code: "DRUG",
 *       is_active: true,
 *       hmis_drug_id: "uuid-from-hmis"  // HMIS reference ID for linking
 *     }
 *   ]
 * }
 */

// GET: HMIS pulls VPMS items
export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const authErr = validateBridge(request)
  if (authErr) return authErr

  const supabase = await createClient()
  const since = request.nextUrl.searchParams.get('since')
  const category = request.nextUrl.searchParams.get('category')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '500')

  let query = supabase.from('items')
    .select('id, item_code, generic_name, brand_name, manufacturer, unit, gst_percent, hsn_code, strength, dosage_form, reorder_level, min_stock, max_stock, is_active, is_consignment, consignment_category, updated_at, category:item_categories(code, name)')
    .order('item_code')
    .limit(Math.min(limit, 1000))

  if (since) query = query.gte('updated_at', since)
  if (category) query = query.eq('category_code', category)

  const { data: items, error } = await query
  if (error) return bridgeError('items_pull', error.message, 500)

  // Also include stock levels per centre
  const itemIds = (items || []).map(i => i.id)
  let stockMap: Record<string, any[]> = {}
  if (itemIds.length > 0 && itemIds.length <= 200) {
    const { data: stockLevels } = await supabase
      .from('item_centre_stock')
      .select('item_id, centre_id, current_stock, centre:centres(code)')
      .in('item_id', itemIds)

    stockLevels?.forEach(s => {
      if (!stockMap[s.item_id]) stockMap[s.item_id] = []
      stockMap[s.item_id].push({ centre_code: (s.centre as any)?.code, current_stock: s.current_stock })
    })
  }

  const response = (items || []).map(item => ({
    ...item,
    stock_levels: stockMap[item.id] || [],
  }))

  return bridgeSuccess('items_pull', {
    count: response.length,
    since: since || 'full',
    items: response,
  })
})

// POST: HMIS pushes items to VPMS
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const authErr = validateBridge(request)
  if (authErr) return authErr

  const body = await request.json()
  const { items } = body

  if (!items?.length) return bridgeError('items_push', 'items[] required')

  const supabase = await createClient()
  let created = 0, updated = 0, failed = 0
  const errors: any[] = []

  for (const item of items) {
    if (!item.item_code || !item.generic_name) {
      errors.push({ item_code: item.item_code, reason: 'item_code and generic_name required' })
      failed++
      continue
    }

    // Check if exists
    const { data: existing } = await supabase.from('items')
      .select('id').eq('item_code', item.item_code).single()

    // Resolve category
    let categoryId: string | null = null
    if (item.category_code) {
      const { data: cat } = await supabase.from('item_categories')
        .select('id').eq('code', item.category_code).single()
      categoryId = cat?.id || null
    }

    const payload: any = {
      generic_name: item.generic_name,
      brand_name: item.brand_name || null,
      manufacturer: item.manufacturer || null,
      unit: item.unit || 'Nos',
      gst_percent: item.gst_percent ?? 12,
      hsn_code: item.hsn_code || null,
      strength: item.strength || null,
      dosage_form: item.dosage_form || null,
      is_active: item.is_active !== false,
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase.from('items').update(payload).eq('id', existing.id)
      if (error) { errors.push({ item_code: item.item_code, reason: error.message }); failed++ }
      else updated++
    } else {
      const { error } = await supabase.from('items').insert({ ...payload, item_code: item.item_code })
      if (error) { errors.push({ item_code: item.item_code, reason: error.message }); failed++ }
      else created++
    }
  }

  return bridgeSuccess('items_push', {
    total: items.length, created, updated, failed,
    errors: errors.length > 0 ? errors : undefined,
  })
})
