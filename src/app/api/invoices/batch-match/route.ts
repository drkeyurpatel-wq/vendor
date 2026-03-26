import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// ============================================================
// H1 VPMS — Batch 3-Way Match
// Processes all invoices with match_status = 'pending'
// Called from: cron/daily, manual button, invoice creation
// ============================================================

const RATE_TOLERANCE = 0.005 // 0.5%
const QTY_TOLERANCE = 0.02  // 2%

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 5, 60000)
  if (!rateLimitResult.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user, userId } = await requireApiAuth()
  // Get all pending invoices with their PO and GRN
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, po_id, grn_id, total_amount, gst_amount, vendor_invoice_no')
    .in('match_status', ['pending', null])
    .limit(100)

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No pending invoices' })
  }

  let matched = 0, partial = 0, mismatched = 0, skipped = 0

  for (const inv of invoices) {
    if (!inv.po_id || !inv.grn_id) { skipped++; continue }

    // Get PO items
    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('item_id, ordered_qty, rate, total_amount')
      .eq('po_id', inv.po_id)

    // Get GRN items
    const { data: grnItems } = await supabase
      .from('grn_items')
      .select('item_id, ordered_qty, accepted_qty, rate, total_amount')
      .eq('grn_id', inv.grn_id)

    if (!poItems?.length || !grnItems?.length) { skipped++; continue }

    // Build lookup maps
    const poMap = new Map(poItems.map(p => [p.item_id, p]))
    const grnMap = new Map(grnItems.map(g => [g.item_id, g]))

    const details: any[] = []
    let allMatch = true
    let anyMatch = false

    // Compare each GRN item against PO
    for (const [itemId, grnItem] of Array.from(grnMap)) {
      const poItem = poMap.get(itemId)
      if (!poItem) {
        details.push({ item_id: itemId, status: 'extra_in_grn', message: 'Item in GRN but not in PO' })
        allMatch = false
        continue
      }

      const qtyMatch = Math.abs(grnItem.accepted_qty - poItem.ordered_qty) / Math.max(poItem.ordered_qty, 1) <= QTY_TOLERANCE
      const rateMatch = Math.abs((grnItem.rate || 0) - (poItem.rate || 0)) / Math.max(poItem.rate || 1, 1) <= RATE_TOLERANCE

      if (qtyMatch && rateMatch) {
        anyMatch = true
        details.push({ item_id: itemId, status: 'matched', po_qty: poItem.ordered_qty, grn_qty: grnItem.accepted_qty, po_rate: poItem.rate, grn_rate: grnItem.rate })
      } else {
        allMatch = false
        if (qtyMatch || rateMatch) anyMatch = true
        details.push({
          item_id: itemId, status: qtyMatch ? 'rate_mismatch' : rateMatch ? 'qty_mismatch' : 'mismatch',
          po_qty: poItem.ordered_qty, grn_qty: grnItem.accepted_qty,
          po_rate: poItem.rate, grn_rate: grnItem.rate,
          qty_diff: grnItem.accepted_qty - poItem.ordered_qty,
          rate_diff_pct: poItem.rate ? ((grnItem.rate - poItem.rate) / poItem.rate * 100).toFixed(1) + '%' : 'N/A',
        })
      }
    }

    // Determine overall status
    let matchStatus: string
    if (allMatch && details.length > 0) {
      matchStatus = 'matched'
      matched++
    } else if (anyMatch) {
      matchStatus = 'partial_match'
      partial++
    } else {
      matchStatus = 'mismatch'
      mismatched++
    }

    // Update invoice
    await supabase.from('invoices').update({
      match_status: matchStatus,
      qty_match: details.every(d => d.status === 'matched' || d.status === 'rate_mismatch'),
      rate_match: details.every(d => d.status === 'matched' || d.status === 'qty_mismatch'),
      match_details: { items: details, matched_at: new Date().toISOString() },
    }).eq('id', inv.id)
  }

  return NextResponse.json({
    processed: invoices.length,
    matched, partial_match: partial, mismatch: mismatched, skipped,
    message: `${matched} matched, ${partial} partial, ${mismatched} mismatch, ${skipped} skipped`,
  })
})
