import { withApiErrorHandler } from '@/lib/api-error-handler'
import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { invoiceMatchSchema } from '@/lib/validations'
import { sendInAppNotification } from '@/lib/notify-server'

/**
 * 3-Way Matching Engine
 * Compares: PO (ordered qty + rate) vs GRN (accepted qty) vs Invoice (qty + rate)
 *
 * Match rules:
 * - MATCHED: All three match exactly (or within tolerance)
 * - PARTIAL_MATCH: Some items match, some don't
 * - MISMATCH: Significant discrepancy — blocks payment
 *
 * Rate tolerance: ±0.5% (for rate contract items)
 */

const RATE_TOLERANCE = 0.005 // 0.5%

interface MatchResult {
  item_id: string
  po_qty: number
  po_rate: number
  grn_qty: number
  invoice_qty: number
  invoice_rate: number
  qty_match: boolean
  rate_match: boolean
}

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = invoiceMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { invoice_id } = parsed.data

  // Get invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, grn:grns(id, po_id)')
    .eq('id', invoice_id)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const poId = invoice.po_id || invoice.grn?.po_id
  if (!poId) {
    // No PO linked — flag as mismatch (No PO = No Payment rule)
    await supabase.from('invoices')
      .update({ match_status: 'mismatch' })
      .eq('id', invoice_id)
    return NextResponse.json({
      match_status: 'mismatch',
      reason: 'No PO linked to this invoice — payment blocked',
      results: [],
    })
  }

  // Get PO items
  const { data: poItems } = await supabase
    .from('purchase_order_items')
    .select('item_id, ordered_qty, rate')
    .eq('po_id', poId)

  // Get GRN items (all GRNs for this PO)
  const { data: grns } = await supabase
    .from('grns')
    .select('id')
    .eq('po_id', poId)
    .in('status', ['submitted', 'verified'])

  let grnItemsMap = new Map<string, number>()
  if (grns && grns.length > 0) {
    const grnIds = grns.map(g => g.id)
    const { data: grnItems } = await supabase
      .from('grn_items')
      .select('item_id, accepted_qty')
      .in('grn_id', grnIds)

    grnItems?.forEach((gi: any) => {
      const current = grnItemsMap.get(gi.item_id) || 0
      grnItemsMap.set(gi.item_id, current + gi.accepted_qty)
    })
  }

  // Try to get invoice line items (if table exists)
  const { data: invoiceItems } = await supabase
    .from('invoice_items')
    .select('item_id, qty, rate')
    .eq('invoice_id', invoice_id)

  const invoiceItemsMap = new Map<string, { qty: number; rate: number }>()
  invoiceItems?.forEach((ii: any) => {
    invoiceItemsMap.set(ii.item_id, { qty: ii.qty, rate: ii.rate })
  })

  // Build match results
  const results: MatchResult[] = []
  let allMatch = true
  let anyMatch = false

  for (const poItem of (poItems || [])) {
    const grnQty = grnItemsMap.get(poItem.item_id) || 0
    const invoiceItem = invoiceItemsMap.get(poItem.item_id)

    // Use actual invoice line item data if available, otherwise compare totals
    const invoiceQty = invoiceItem?.qty ?? grnQty
    const invoiceRate = invoiceItem?.rate ?? poItem.rate

    // Qty match: GRN accepted qty should match what's invoiced
    const qtyMatch = grnQty === invoiceQty && grnQty > 0
    const rateDiff = poItem.rate > 0 ? Math.abs(poItem.rate - invoiceRate) / poItem.rate : 0
    const rateMatch = rateDiff <= RATE_TOLERANCE

    results.push({
      item_id: poItem.item_id,
      po_qty: poItem.ordered_qty,
      po_rate: poItem.rate,
      grn_qty: grnQty,
      invoice_qty: invoiceQty,
      invoice_rate: invoiceRate,
      qty_match: qtyMatch,
      rate_match: rateMatch,
    })

    if (qtyMatch && rateMatch) {
      anyMatch = true
    } else {
      allMatch = false
    }
  }

  // Also compare total amounts as a cross-check
  const poTotal = poItems?.reduce((s, p: any) => s + (p.ordered_qty * p.rate), 0) ?? 0
  const grnTotal = Array.from(grnItemsMap.entries()).reduce((s, [itemId, qty]) => {
    const poItem = poItems?.find((p: any) => p.item_id === itemId)
    return s + qty * (poItem?.rate || 0)
  }, 0)
  const invoiceTotal = invoice.total_amount || 0
  const totalDiff = poTotal > 0 ? Math.abs(grnTotal - invoiceTotal) / poTotal : 0

  // Determine match status
  let matchStatus: string
  if (allMatch && results.length > 0 && totalDiff <= RATE_TOLERANCE) {
    matchStatus = 'matched'
  } else if (anyMatch || totalDiff <= 0.05) {
    matchStatus = 'partial_match'
  } else {
    matchStatus = 'mismatch'
  }

  // Update invoice
  const now = new Date().toISOString()
  await supabase.from('invoices')
    .update({ match_status: matchStatus, updated_at: now })
    .eq('id', invoice_id)

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'invoice_matched',
    entity_type: 'invoice',
    entity_id: invoice_id,
    details: { match_status: matchStatus, item_count: results.length },
  })

  // Notify: in-app notification (especially important on mismatch — payment blocked)
  sendInAppNotification(supabase, {
    action: 'invoice_matched',
    entity_type: 'invoice',
    entity_id: invoice_id,
    details: { match_status: matchStatus, invoice_ref: invoice_id },
    actor_user_id: user.id,
  }).catch(() => {})

  return NextResponse.json({
    match_status: matchStatus,
    results,
    summary: {
      total_items: results.length,
      matched: results.filter(r => r.qty_match && r.rate_match).length,
      mismatched: results.filter(r => !r.qty_match || !r.rate_match).length,
    },
  })
})
