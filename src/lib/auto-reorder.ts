import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-reorder: given items that dropped below reorder level,
 * look up L1 vendor from vendor_items, skip items with open POs,
 * group by vendor+centre, and create draft POs.
 *
 * Called automatically after consumption upload when stock crosses
 * reorder threshold, or manually from the reorder engine panel.
 */

interface ReorderCandidate {
  itemId: string
  centreId: string
  newStock: number
  reorderLevel: number
}

interface CreatedPO {
  po_number: string
  vendor_name: string
  centre_code: string
  item_count: number
  total: number
}

export async function autoReorderForItems(
  supabase: SupabaseClient,
  candidates: ReorderCandidate[],
  userId: string
): Promise<{ created: number; pos: CreatedPO[]; skipped: number }> {
  if (candidates.length === 0) return { created: 0, pos: [], skipped: 0 }

  const itemIds = candidates.map(c => c.itemId)
  const centreIds = Array.from(new Set(candidates.map(c => c.centreId)))

  // 1. Look up L1 vendors from vendor_items
  const { data: vendorItems } = await supabase
    .from('vendor_items')
    .select('item_id, vendor_id, last_quoted_rate, vendor:vendors(vendor_code, legal_name, status)')
    .in('item_id', itemIds)
    .eq('l_rank', 1)

  const vendorMap = new Map<string, { vendor_id: string; vendor_code: string; vendor_name: string; rate: number }>()
  ;(vendorItems || []).forEach((vi: any) => {
    if (vi.vendor?.status === 'active') {
      vendorMap.set(vi.item_id, {
        vendor_id: vi.vendor_id,
        vendor_code: vi.vendor.vendor_code,
        vendor_name: vi.vendor.legal_name,
        rate: vi.last_quoted_rate || 0,
      })
    }
  })

  // 2. Check for existing open POs to avoid duplicates
  const { data: openPOItems } = await supabase
    .from('purchase_order_items')
    .select('item_id, po:purchase_orders!inner(centre_id, status)')
    .in('item_id', itemIds)
    .in('po.status', ['draft', 'pending_approval', 'approved', 'sent_to_vendor'])

  const openPOSet = new Set(
    (openPOItems || []).map((pi: any) => `${pi.item_id}_${pi.po?.centre_id}`)
  )

  // 3. Get item details and max_level for reorder qty calculation
  const { data: stockRows } = await supabase
    .from('item_centre_stock')
    .select('item_id, centre_id, current_stock, reorder_level, max_level, item:items(item_code, generic_name, unit)')
    .in('item_id', itemIds)
    .in('centre_id', centreIds)

  // 4. Get centre codes for PO number generation
  const { data: centres } = await supabase.from('centres').select('id, code').in('id', centreIds)
  const centreCodeMap = new Map((centres || []).map(c => [c.id, c.code]))

  // 5. Group into draft POs: vendor_id + centre_id
  const drafts = new Map<string, {
    vendor_id: string; vendor_code: string; vendor_name: string
    centre_id: string; centre_code: string
    items: Array<{ item_id: string; item_code: string; generic_name: string; unit: string; ordered_qty: number; rate: number }>
    subtotal: number
  }>()

  let skipped = 0

  for (const candidate of candidates) {
    // Skip if open PO already exists
    if (openPOSet.has(`${candidate.itemId}_${candidate.centreId}`)) { skipped++; continue }

    // Skip if no L1 vendor
    const l1 = vendorMap.get(candidate.itemId)
    if (!l1) { skipped++; continue }

    // Find stock row for max_level
    const stockRow = (stockRows || []).find((s: any) => s.item_id === candidate.itemId && s.centre_id === candidate.centreId) as any
    if (!stockRow) { skipped++; continue }

    const maxLevel = stockRow.max_level || stockRow.reorder_level * 2
    const orderQty = Math.max(1, Math.ceil(maxLevel - candidate.newStock))

    const key = `${l1.vendor_id}_${candidate.centreId}`
    if (!drafts.has(key)) {
      drafts.set(key, {
        vendor_id: l1.vendor_id, vendor_code: l1.vendor_code, vendor_name: l1.vendor_name,
        centre_id: candidate.centreId, centre_code: centreCodeMap.get(candidate.centreId) || 'XXX',
        items: [], subtotal: 0,
      })
    }
    const draft = drafts.get(key)!
    draft.items.push({
      item_id: candidate.itemId,
      item_code: stockRow.item?.item_code || '',
      generic_name: stockRow.item?.generic_name || '',
      unit: stockRow.item?.unit || 'Nos',
      ordered_qty: orderQty,
      rate: l1.rate,
    })
    draft.subtotal += l1.rate * orderQty
  }

  if (drafts.size === 0) return { created: 0, pos: [], skipped }

  // 6. Create draft POs
  const createdPOs: CreatedPO[] = []

  for (const draft of Array.from(drafts.values())) {
    // Generate PO number
    const now = new Date()
    const prefix = `H1-${draft.centre_code}-PO-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}-AR`
    const { data: lastPO } = await supabase
      .from('purchase_orders').select('po_number')
      .like('po_number', `${prefix}%`)
      .order('po_number', { ascending: false }).limit(1)

    const seq = lastPO?.[0]?.po_number ? parseInt(lastPO[0].po_number.slice(-3)) + 1 : 1
    const poNumber = `${prefix}${String(seq).padStart(3, '0')}`
    const today = now.toISOString().split('T')[0]

    const gstAmount = draft.subtotal * 0.12
    const { data: newPO, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        po_date: today,
        vendor_id: draft.vendor_id,
        centre_id: draft.centre_id,
        status: 'draft',
        priority: 'normal',
        supply_type: 'intra_state',
        subtotal: draft.subtotal,
        gst_amount: gstAmount,
        total_amount: draft.subtotal + gstAmount,
        notes: `Auto-reorder from consumption — ${draft.items.length} items hit reorder level`,
        created_by: userId,
      })
      .select('id')
      .single()

    if (poError || !newPO) continue

    // Insert PO line items
    const poItems = draft.items.map((item: { item_id: string; unit: string; ordered_qty: number; rate: number }) => ({
      po_id: newPO.id,
      item_id: item.item_id,
      ordered_qty: item.ordered_qty,
      pending_qty: item.ordered_qty,
      rate: item.rate,
      gst_percent: 12,
      gst_amount: item.rate * item.ordered_qty * 0.12,
      total_amount: item.rate * item.ordered_qty * 1.12,
      unit: item.unit,
    }))

    await supabase.from('purchase_order_items').insert(poItems)

    createdPOs.push({
      po_number: poNumber,
      vendor_name: draft.vendor_name,
      centre_code: draft.centre_code,
      item_count: draft.items.length,
      total: draft.subtotal + gstAmount,
    })
  }

  return { created: createdPOs.length, pos: createdPOs, skipped }
}
