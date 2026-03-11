import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Consumption CSV Import API
 * Accepts JSON array of consumption records (parsed from CSV on the client).
 * Each record: { ecw_item_code | item_code, centre_code, qty_consumed, date, department?, patient_id? }
 *
 * For each record:
 * 1. Maps ecw_item_code → item_id via items.ecw_item_code or items.item_code
 * 2. Deducts qty from item_centre_stock
 * 3. Writes stock_ledger entry
 * 4. If stock falls below reorder_level → auto-creates purchase indent
 */

interface ConsumptionRow {
  ecw_item_code?: string
  item_code?: string
  centre_code: string
  qty_consumed: number
  date: string
  department?: string
  patient_id?: string
  notes?: string
}

interface ImportResult {
  total: number
  processed: number
  skipped: number
  errors: { row: number; reason: string }[]
  indents_created: number
}

export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimit(req, 5, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['group_admin', 'group_cao', 'unit_cao', 'store_staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const rows: ConsumptionRow[] = body.records

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No records provided' }, { status: 400 })
  }

  // Pre-fetch all centres
  const { data: centres } = await supabase.from('centres').select('id, code')
  const centreMap = new Map(centres?.map(c => [c.code.toUpperCase(), c.id]) || [])

  // Pre-fetch all items (for mapping)
  const { data: items } = await supabase
    .from('items')
    .select('id, item_code, ecw_item_code')
    .is('deleted_at', null)

  const itemByCode = new Map(items?.map(i => [i.item_code, i.id]) || [])
  const itemByEcw = new Map(
    items?.filter(i => i.ecw_item_code).map(i => [i.ecw_item_code!, i.id]) || []
  )

  const result: ImportResult = {
    total: rows.length,
    processed: 0,
    skipped: 0,
    errors: [],
    indents_created: 0,
  }

  // Track items that fell below reorder level for auto-indent
  const reorderNeeded: Map<string, { item_id: string; centre_id: string; current_stock: number; reorder_level: number }> = new Map()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    // Validate
    if (!row.centre_code) {
      result.errors.push({ row: rowNum, reason: 'Missing centre_code' })
      result.skipped++
      continue
    }
    if (!row.qty_consumed || row.qty_consumed <= 0) {
      result.errors.push({ row: rowNum, reason: 'Invalid qty_consumed' })
      result.skipped++
      continue
    }

    // Resolve centre
    const centreId = centreMap.get(row.centre_code.toUpperCase())
    if (!centreId) {
      result.errors.push({ row: rowNum, reason: `Unknown centre: ${row.centre_code}` })
      result.skipped++
      continue
    }

    // Resolve item (try ecw_item_code first, then item_code)
    let itemId: string | undefined
    if (row.ecw_item_code) {
      itemId = itemByEcw.get(row.ecw_item_code) || itemByCode.get(row.ecw_item_code)
    }
    if (!itemId && row.item_code) {
      itemId = itemByCode.get(row.item_code)
    }
    if (!itemId) {
      result.errors.push({ row: rowNum, reason: `Unknown item: ${row.ecw_item_code || row.item_code}` })
      result.skipped++
      continue
    }

    // Get current stock
    const { data: stock } = await supabase
      .from('item_centre_stock')
      .select('id, current_stock, reorder_level')
      .eq('item_id', itemId)
      .eq('centre_id', centreId)
      .single()

    if (!stock) {
      result.errors.push({ row: rowNum, reason: `No stock record for this item at ${row.centre_code}` })
      result.skipped++
      continue
    }

    const newStock = Math.max(0, stock.current_stock - row.qty_consumed)

    // Deduct stock
    await supabase
      .from('item_centre_stock')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', stock.id)

    // Write stock ledger
    await supabase.from('stock_ledger').insert({
      centre_id: centreId,
      item_id: itemId,
      transaction_type: 'consumption',
      quantity: -row.qty_consumed,
      balance_after: newStock,
      reference_number: row.patient_id || null,
      notes: [row.department, row.notes].filter(Boolean).join(' | ') || `eCW import ${row.date}`,
      created_by: user.id,
    })

    result.processed++

    // Check if reorder needed
    if (newStock <= stock.reorder_level && stock.current_stock > stock.reorder_level) {
      const key = `${itemId}:${centreId}`
      if (!reorderNeeded.has(key)) {
        reorderNeeded.set(key, {
          item_id: itemId,
          centre_id: centreId,
          current_stock: newStock,
          reorder_level: stock.reorder_level,
        })
      }
    }
  }

  // Auto-create purchase indents for items that hit reorder level
  // Rule #7: L1 vendor auto-selection from rate contracts
  if (reorderNeeded.size > 0) {
    const centreGroups: Record<string, { item_id: string; centre_id: string; current_stock: number; reorder_level: number }[]> = {}

    Array.from(reorderNeeded.values()).forEach((item) => {
      if (!centreGroups[item.centre_id]) centreGroups[item.centre_id] = []
      centreGroups[item.centre_id].push(item)
    })

    // Fetch active rate contract items with L1 vendor ranking for all reorder items
    const allItemIds = Array.from(reorderNeeded.values()).map(r => r.item_id)
    const today = new Date().toISOString().split('T')[0]
    const { data: contractItems } = await supabase
      .from('rate_contract_items')
      .select('item_id, rate, vendor_rank, rate_contract:rate_contracts!inner(vendor_id, status, valid_from, valid_to)')
      .in('item_id', allItemIds)
      .eq('rate_contract.status', 'active')
      .lte('rate_contract.valid_from', today)
      .gte('rate_contract.valid_to', today)
      .order('vendor_rank', { ascending: true })

    // Build map: item_id → { vendor_id, rate, rank }  (L1 = rank 1 preferred)
    const l1VendorMap = new Map<string, { vendor_id: string; rate: number; rank: number }>()
    contractItems?.forEach((ci: any) => {
      const existing = l1VendorMap.get(ci.item_id)
      const rank = ci.vendor_rank || 99
      if (!existing || rank < existing.rank) {
        l1VendorMap.set(ci.item_id, {
          vendor_id: ci.rate_contract?.vendor_id,
          rate: ci.rate,
          rank,
        })
      }
    })

    for (const centreId of Object.keys(centreGroups)) {
      const itemsList = centreGroups[centreId]
      const centreCode = centres?.find(c => c.id === centreId)?.code || 'XXX'

      // Generate indent number
      let indentNumber: string
      try {
        const { data } = await supabase.rpc('next_sequence_number', {
          seq_name: 'indent_number_seq',
          seq_type: 'indent',
          centre_code: centreCode,
        })
        indentNumber = data
      } catch {
        const { count } = await supabase.from('purchase_indents').select('*', { count: 'exact', head: true })
        const seq = (count ?? 0) + 1
        const ym = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7)
        indentNumber = `H1-${centreCode}-IND-${ym}-${String(seq).padStart(3, '0')}`
      }

      // Determine suggested vendor (L1 from rate contracts)
      const vendorCounts = new Map<string, number>()
      itemsList.forEach((item: { item_id: string; centre_id: string; current_stock: number; reorder_level: number }) => {
        const l1 = l1VendorMap.get(item.item_id)
        if (l1) {
          vendorCounts.set(l1.vendor_id, (vendorCounts.get(l1.vendor_id) || 0) + 1)
        }
      })

      // Pick the most common L1 vendor across indent items
      let suggestedVendorId: string | null = null
      let maxCount = 0
      vendorCounts.forEach((count, vid) => {
        if (count > maxCount) { maxCount = count; suggestedVendorId = vid }
      })

      const l1Notes = suggestedVendorId
        ? `Auto-generated from eCW consumption import on ${new Date().toISOString().split('T')[0]}. L1 vendor auto-selected from active rate contracts.`
        : `Auto-generated from eCW consumption import on ${new Date().toISOString().split('T')[0]}. No active rate contract found — manual vendor selection required.`

      const { data: indent } = await supabase.from('purchase_indents').insert({
        indent_number: indentNumber,
        centre_id: centreId,
        requested_by: user.id,
        status: 'submitted',
        priority: 'normal',
        suggested_vendor_id: suggestedVendorId,
        notes: l1Notes,
      }).select().single()

      if (indent) {
        const indentItems = itemsList.map((item: { item_id: string; centre_id: string; current_stock: number; reorder_level: number }) => {
          const l1 = l1VendorMap.get(item.item_id)
          return {
            indent_id: indent.id,
            item_id: item.item_id,
            requested_qty: Math.max(1, item.reorder_level * 2 - item.current_stock),
            unit: 'nos',
            current_stock: item.current_stock,
            suggested_vendor_id: l1?.vendor_id || null,
            suggested_rate: l1?.rate || null,
          }
        })

        await supabase.from('purchase_indent_items').insert(indentItems)
        result.indents_created++
      }
    }
  }

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'consumption_import',
    entity_type: 'stock',
    details: {
      total: result.total,
      processed: result.processed,
      skipped: result.skipped,
      indents_created: result.indents_created,
    },
  })

  return NextResponse.json(result)
}
