import { withApiErrorHandler } from '@/lib/api-error-handler'
import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { invoiceMatchSchema } from '@/lib/validations'
import { matchLineItem, computeMatchStatus, type MatchLineItem } from '@/lib/business-rules'

/**
 * 3-Way Match — Single Invoice
 * Uses business-rules.ts matchLineItem (the tested, correct logic):
 *   PO qty vs Invoice qty (within 2% tolerance)
 *   GRN accepted qty vs Invoice qty (within 2% tolerance)
 *   PO rate vs Invoice rate (within 0.5% tolerance)
 * ALL THREE must pass for qty_match = true
 */

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rl = await rateLimit(request, 20, 60000)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { supabase, user } = await requireApiAuth()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = invoiceMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { invoice_id } = parsed.data

  // ── Fetch invoice ──
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, po_id, grn_id, total_amount')
    .eq('id', invoice_id)
    .single()

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // ── Resolve PO ID ──
  let poId = invoice.po_id
  if (!poId && invoice.grn_id) {
    const { data: grn } = await supabase.from('grns').select('po_id').eq('id', invoice.grn_id).single()
    poId = grn?.po_id
  }

  if (!poId) {
    await supabase.from('invoices').update({ match_status: 'mismatch', updated_at: new Date().toISOString() }).eq('id', invoice_id)
    return NextResponse.json({
      match_status: 'mismatch',
      reason: 'No PO linked — payment blocked (No PO = No Payment rule)',
      results: [], summary: { total_items: 0, matched: 0, mismatched: 0 },
    })
  }

  // ── Fetch PO line items ──
  const { data: poItems } = await supabase
    .from('purchase_order_items')
    .select('item_id, ordered_qty, rate')
    .eq('po_id', poId)

  if (!poItems || poItems.length === 0) {
    await supabase.from('invoices').update({ match_status: 'mismatch', updated_at: new Date().toISOString() }).eq('id', invoice_id)
    return NextResponse.json({
      match_status: 'mismatch',
      reason: 'PO has no line items',
      results: [], summary: { total_items: 0, matched: 0, mismatched: 0 },
    })
  }

  // ── Fetch ALL verified/submitted GRN items for this PO ──
  const { data: poGRNs } = await supabase.from('grns').select('id, status').eq('po_id', poId)
  const verifiedGRNs = (poGRNs ?? []).filter(g => g.status === 'verified' || g.status === 'submitted')
  const discrepancyGRNs = (poGRNs ?? []).filter(g => g.status === 'discrepancy')

  if (verifiedGRNs.length === 0) {
    const reason = discrepancyGRNs.length > 0
      ? `${discrepancyGRNs.length} GRN(s) in DISCREPANCY status. Verify the GRN first, then re-run match.`
      : 'No verified GRNs found for this PO'
    await supabase.from('invoices').update({ match_status: 'mismatch', updated_at: new Date().toISOString() }).eq('id', invoice_id)
    return NextResponse.json({
      match_status: 'mismatch', reason,
      results: [], summary: { total_items: 0, matched: 0, mismatched: 0 },
    })
  }

  // Aggregate GRN accepted qty per item across all GRNs
  const grnIds = verifiedGRNs.map(g => g.id)
  const { data: grnItems } = await supabase.from('grn_items').select('item_id, accepted_qty').in('grn_id', grnIds)
  const grnQtyMap = new Map<string, number>()
  grnItems?.forEach((gi: any) => {
    grnQtyMap.set(gi.item_id, (grnQtyMap.get(gi.item_id) || 0) + (gi.accepted_qty || 0))
  })

  // ── Fetch invoice line items (table may not exist) ──
  let invoiceItemsMap = new Map<string, { qty: number; rate: number }>()
  try {
    const { data, error } = await supabase.from('invoice_items').select('item_id, qty, rate').eq('invoice_id', invoice_id)
    if (!error && data) {
      data.forEach((ii: any) => invoiceItemsMap.set(ii.item_id, { qty: ii.qty, rate: ii.rate }))
    }
  } catch { /* table doesn't exist */ }

  // ── Build match items using business-rules.ts ──
  const matchItems: MatchLineItem[] = poItems.map((po: any) => {
    const grnAccepted = grnQtyMap.get(po.item_id) || 0
    const invItem = invoiceItemsMap.get(po.item_id)
    return {
      item_id: po.item_id,
      po_qty: po.ordered_qty || 0,
      po_rate: po.rate || 0,
      grn_accepted_qty: grnAccepted,
      // If no invoice line items table, use GRN qty and PO rate as invoice values
      invoice_qty: invItem?.qty ?? grnAccepted,
      invoice_rate: invItem?.rate ?? po.rate,
    }
  })

  // ── Run the CORRECT 3-way match from business-rules.ts ──
  const matchStatus = computeMatchStatus(matchItems)
  const itemResults = matchItems.map(item => {
    const result = matchLineItem(item)
    return {
      item_id: item.item_id,
      po_qty: item.po_qty,
      po_rate: item.po_rate,
      grn_qty: item.grn_accepted_qty,
      invoice_qty: item.invoice_qty,
      invoice_rate: item.invoice_rate,
      qty_match: result.status === 'matched' || result.status === 'rate_mismatch',
      rate_match: result.status === 'matched' || result.status === 'qty_mismatch',
    }
  })

  // ── Update invoice ──
  const { error: updateErr } = await supabase.from('invoices').update({
    match_status: matchStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', invoice_id)

  if (updateErr) {
    return NextResponse.json({ error: `Failed to update invoice: ${updateErr.message}` }, { status: 500 })
  }

  // ── Audit (non-blocking) ──
  try {
    await supabase.from('activity_log').insert({
      user_id: user.id, action: 'invoice_matched', entity_type: 'invoice', entity_id: invoice_id,
      details: { match_status: matchStatus, item_count: itemResults.length },
    })
  } catch { /* non-critical */ }

  // ── Warnings ──
  const warnings: string[] = []
  if (discrepancyGRNs.length > 0) warnings.push(`${discrepancyGRNs.length} GRN(s) in discrepancy — not included in match`)
  if (invoiceItemsMap.size === 0) warnings.push('No invoice line items — using GRN quantities and PO rates as invoice values')

  return NextResponse.json({
    match_status: matchStatus,
    results: itemResults,
    summary: {
      total_items: itemResults.length,
      matched: itemResults.filter(r => r.qty_match && r.rate_match).length,
      mismatched: itemResults.filter(r => !r.qty_match || !r.rate_match).length,
    },
    ...(warnings.length > 0 && { warnings }),
  })
})
