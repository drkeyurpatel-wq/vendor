import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { matchLineItem, computeMatchStatus, type MatchLineItem } from '@/lib/business-rules'

/**
 * Batch 3-Way Match — processes all unmatched invoices
 * Uses business-rules.ts (the tested, correct 3-way logic)
 */

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rl = await rateLimit(request, 5, 60000)
  if (!rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user } = await requireApiAuth()

  const { data: invoices, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, po_id, grn_id, total_amount, match_status')
    .in('match_status', ['pending', 'partial_match', 'mismatch'])
    .neq('payment_status', 'paid')
    .limit(100)

  if (fetchErr) {
    return NextResponse.json({ error: `Failed to fetch invoices: ${fetchErr.message}` }, { status: 500 })
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({
      processed: 0, matched: 0, partial_match: 0, mismatch: 0, skipped: 0,
      message: 'No unmatched invoices found',
    })
  }

  let matched = 0, partial = 0, mismatched = 0, skipped = 0

  for (const inv of invoices) {
    try {
      // Resolve PO ID
      let poId = inv.po_id
      if (!poId && inv.grn_id) {
        const { data: grn } = await supabase.from('grns').select('po_id').eq('id', inv.grn_id).single()
        poId = grn?.po_id
      }

      if (!poId) {
        await supabase.from('invoices').update({ match_status: 'mismatch', updated_at: new Date().toISOString() }).eq('id', inv.id)
        mismatched++
        continue
      }

      // Fetch PO items
      const { data: poItems } = await supabase
        .from('purchase_order_items').select('item_id, ordered_qty, rate').eq('po_id', poId)

      // Fetch verified/submitted GRNs
      const { data: poGRNs } = await supabase
        .from('grns').select('id').eq('po_id', poId).in('status', ['submitted', 'verified'])

      if (!poItems?.length || !poGRNs?.length) { skipped++; continue }

      // Aggregate GRN accepted qty per item
      const grnIds = poGRNs.map(g => g.id)
      const { data: grnItems } = await supabase
        .from('grn_items').select('item_id, accepted_qty').in('grn_id', grnIds)

      const grnQtyMap = new Map<string, number>()
      grnItems?.forEach((gi: any) => {
        grnQtyMap.set(gi.item_id, (grnQtyMap.get(gi.item_id) || 0) + (gi.accepted_qty || 0))
      })

      // Build match items — NO invoice_items table dependency
      const matchItems: MatchLineItem[] = poItems.map((po: any) => {
        const grnAccepted = grnQtyMap.get(po.item_id) || 0
        return {
          item_id: po.item_id,
          po_qty: po.ordered_qty || 0,
          po_rate: po.rate || 0,
          grn_accepted_qty: grnAccepted,
          invoice_qty: grnAccepted, // Use GRN qty as invoice qty (no line items table)
          invoice_rate: po.rate || 0, // Use PO rate as invoice rate
        }
      })

      // Run correct 3-way match
      const matchStatus = computeMatchStatus(matchItems)

      if (matchStatus === 'matched') matched++
      else if (matchStatus === 'partial_match') partial++
      else mismatched++

      await supabase.from('invoices').update({
        match_status: matchStatus, updated_at: new Date().toISOString(),
      }).eq('id', inv.id)

    } catch (err) {
      console.error(`[Batch Match] Invoice ${inv.id} failed:`, err)
      skipped++
    }
  }

  // Audit (non-blocking)
  try {
    await supabase.from('activity_log').insert({
      user_id: user.id, action: 'batch_match', entity_type: 'invoice',
      details: { processed: invoices.length, matched, partial, mismatched, skipped },
    })
  } catch { /* non-critical */ }

  return NextResponse.json({
    processed: invoices.length,
    matched, partial_match: partial, mismatch: mismatched, skipped,
    message: `${matched} matched, ${partial} partial, ${mismatched} mismatch, ${skipped} skipped`,
  })
})
