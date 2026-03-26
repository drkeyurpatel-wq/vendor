import { requireApiAuthWithProfile } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Auto-Reorder Engine
 * 
 * GET  /api/reorder/check   — scan stock, return suggestions (dry run)
 * POST /api/reorder/check   — scan stock, create draft POs
 * 
 * Logic:
 * 1. Find items where current_stock <= reorder_level
 * 2. Skip items that already have open POs (pending/approved/sent)
 * 3. Calculate order qty = max_level - current_stock (EOQ-style)
 * 4. Look up L1 vendor + rate from vendor_items
 * 5. Group by centre + vendor → one PO per group
 * 6. POST mode: create draft POs with line items
 */

interface ReorderSuggestion {
  item_id: string
  item_code: string
  item_name: string
  centre_id: string
  centre_code: string
  current_stock: number
  reorder_level: number
  max_level: number
  order_qty: number
  unit: string
  vendor_id: string | null
  vendor_code: string | null
  vendor_name: string | null
  rate: number
  line_total: number
  has_open_po: boolean
}

interface POGroup {
  centre_id: string
  centre_code: string
  vendor_id: string
  vendor_code: string
  vendor_name: string
  items: ReorderSuggestion[]
  total_amount: number
}

export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, 10, 60000)
  if (!rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user, userId, role, centreId, isGroupLevel } = await requireApiAuthWithProfile()
  const suggestions = await scanReorderNeeds(supabase)
  const groups = groupByVendorCentre(suggestions.filter(s => !s.has_open_po && s.vendor_id))

  return NextResponse.json({
    scan_time: new Date().toISOString(),
    total_items_below_reorder: suggestions.length,
    items_with_open_po: suggestions.filter(s => s.has_open_po).length,
    items_without_vendor: suggestions.filter(s => !s.vendor_id).length,
    actionable_items: suggestions.filter(s => !s.has_open_po && s.vendor_id).length,
    suggested_pos: groups.length,
    total_value: groups.reduce((s, g) => s + g.total_amount, 0),
    groups,
    skipped: suggestions.filter(s => s.has_open_po || !s.vendor_id),
  })
}

export async function POST(request: NextRequest) {
  const rl = await rateLimit(request, 5, 60000)
  if (!rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user, userId, role, centreId, isGroupLevel } = await requireApiAuthWithProfile()
  // Check role
  const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const selectedGroupIndices: number[] = body.groups || [] // empty = all

  const suggestions = await scanReorderNeeds(supabase)
  const allGroups = groupByVendorCentre(suggestions.filter(s => !s.has_open_po && s.vendor_id))

  const groupsToProcess = selectedGroupIndices.length > 0
    ? selectedGroupIndices.map(i => allGroups[i]).filter(Boolean)
    : allGroups

  if (groupsToProcess.length === 0) {
    return NextResponse.json({ error: 'No reorder groups to process', created: 0 }, { status: 200 })
  }

  // Generate POs
  const created: { po_number: string; vendor: string; centre: string; items: number; total: number }[] = []
  const errors: string[] = []

  for (const group of groupsToProcess) {
    try {
      // Generate PO number
      const monthStr = new Date().toISOString().slice(2, 7).replace('-', '')
      const { data: existingPOs } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .like('po_number', `H1-${group.centre_code}-PO-${monthStr}%`)
        .order('po_number', { ascending: false })
        .limit(1)

      let seq = 1
      if (existingPOs && existingPOs.length > 0) {
        const lastNum = existingPOs[0].po_number.split('-').pop()
        seq = parseInt(lastNum || '0') + 1
      }
      const poNumber = `H1-${group.centre_code}-PO-${monthStr}-${String(seq).padStart(3, '0')}`

      // Calculate totals
      const subtotal = group.items.reduce((s, i) => s + i.line_total, 0)
      const gstPercent = 12 // Default, will be overridden per item in real usage
      const gstAmount = Math.round(subtotal * gstPercent / 100 * 100) / 100

      // Create PO
      const { data: po, error: poError } = await supabase.from('purchase_orders').insert({
        po_number: poNumber,
        po_date: new Date().toISOString().split('T')[0],
        vendor_id: group.vendor_id,
        centre_id: group.centre_id,
        status: 'draft',
        priority: 'normal',
        subtotal,
        gst_amount: gstAmount,
        total_amount: subtotal + gstAmount,
        notes: `Auto-generated reorder PO — ${group.items.length} items below reorder level`,
        created_by: user.id,
      }).select('id').single()

      if (poError || !po) { errors.push(`${group.centre_code}/${group.vendor_code}: ${poError?.message}`); continue }

      // Create PO items
      const poItems = group.items.map((item, idx) => ({
        po_id: po.id,
        item_id: item.item_id,
        ordered_qty: item.order_qty,
        unit: item.unit,
        rate: item.rate,
        gst_percent: gstPercent,
        total_amount: item.line_total,
        line_number: idx + 1,
      }))

      const { error: itemsError } = await supabase.from('purchase_order_items').insert(poItems)
      if (itemsError) { errors.push(`${poNumber} items: ${itemsError.message}`) }

      // Audit log
      try {
        await supabase.from('audit_logs').insert({
          entity_type: 'purchase_order', entity_id: po.id,
          action: 'auto_reorder_created',
          details: { po_number: poNumber, items: group.items.length, total: subtotal + gstAmount },
          user_id: user.id,
        })
      } catch {}

      created.push({
        po_number: poNumber, vendor: group.vendor_name,
        centre: group.centre_code, items: group.items.length,
        total: subtotal + gstAmount,
      })
    } catch (e: any) {
      errors.push(`${group.centre_code}/${group.vendor_code}: ${e.message}`)
    }
  }

  return NextResponse.json({
    created: created.length,
    total_value: created.reduce((s, c) => s + c.total, 0),
    pos: created,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// ─── Core Logic ──────────────────────────────────────────

async function scanReorderNeeds(supabase: any): Promise<ReorderSuggestion[]> {
  // Get all stock below reorder level
  const { data: lowStock } = await supabase
    .from('item_centre_stock')
    .select('item_id, centre_id, current_stock, reorder_level, max_level, last_grn_rate, item:items(item_code, generic_name, unit, is_active), centre:centres(code)')
    .gt('reorder_level', 0)
    .order('centre_id')

  if (!lowStock || lowStock.length === 0) return []

  // Filter to actual below-reorder items (can't do current_stock <= reorder_level in one Supabase call easily)
  const belowReorder = lowStock.filter((s: any) => s.current_stock <= s.reorder_level && s.item?.is_active !== false)

  if (belowReorder.length === 0) return []

  // Get L1 vendors for these items
  const itemIds = Array.from(new Set(belowReorder.map((s: any) => s.item_id)))
  const { data: vendorMappings } = await supabase
    .from('vendor_items')
    .select('item_id, vendor_id, last_purchase_rate, contracted_rate, l_rank, vendor:vendors(vendor_code, legal_name, status)')
    .in('item_id', itemIds)
    .eq('l_rank', 1)

  const vendorMap = new Map<string, any>()
  ;(vendorMappings || []).forEach((vm: any) => {
    if (vm.vendor?.status === 'active') vendorMap.set(vm.item_id, vm)
  })

  // Check for open POs on these items
  const { data: openPOItems } = await supabase
    .from('purchase_order_items')
    .select('item_id, po:purchase_orders(status, centre_id)')
    .in('item_id', itemIds)

  const openPOSet = new Set<string>()
  ;(openPOItems || []).forEach((pi: any) => {
    if (pi.po && ['pending_approval', 'approved', 'sent_to_vendor', 'partially_received'].includes(pi.po.status)) {
      openPOSet.add(`${pi.item_id}__${pi.po.centre_id}`)
    }
  })

  return belowReorder.map((stock: any) => {
    const vm = vendorMap.get(stock.item_id)
    const rate = vm?.contracted_rate || vm?.last_purchase_rate || stock.last_grn_rate || 0
    const orderQty = Math.max(1, Math.round((stock.max_level || stock.reorder_level * 3) - stock.current_stock))

    return {
      item_id: stock.item_id,
      item_code: stock.item?.item_code || '',
      item_name: stock.item?.generic_name || '',
      centre_id: stock.centre_id,
      centre_code: stock.centre?.code || '',
      current_stock: stock.current_stock,
      reorder_level: stock.reorder_level,
      max_level: stock.max_level || stock.reorder_level * 3,
      order_qty: orderQty,
      unit: stock.item?.unit || 'nos',
      vendor_id: vm?.vendor_id || null,
      vendor_code: vm?.vendor?.vendor_code || null,
      vendor_name: vm?.vendor?.legal_name || null,
      rate,
      line_total: Math.round(orderQty * rate * 100) / 100,
      has_open_po: openPOSet.has(`${stock.item_id}__${stock.centre_id}`),
    }
  })
}

function groupByVendorCentre(suggestions: ReorderSuggestion[]): POGroup[] {
  const map = new Map<string, POGroup>()

  suggestions.forEach(s => {
    if (!s.vendor_id) return
    const key = `${s.centre_id}__${s.vendor_id}`
    if (!map.has(key)) {
      map.set(key, {
        centre_id: s.centre_id, centre_code: s.centre_code,
        vendor_id: s.vendor_id, vendor_code: s.vendor_code!,
        vendor_name: s.vendor_name!, items: [], total_amount: 0,
      })
    }
    const g = map.get(key)!
    g.items.push(s)
    g.total_amount += s.line_total
  })

  return Array.from(map.values()).sort((a, b) => b.total_amount - a.total_amount)
}
