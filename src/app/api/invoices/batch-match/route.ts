import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { RATE_TOLERANCE, QTY_TOLERANCE } from '@/lib/business-rules'

// ============================================================
// H1 VPMS — Batch 3-Way Match
// Processes all unmatched invoices (pending, partial_match, mismatch)
// Called from: cron/daily, manual button on invoice list
// ============================================================

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 5, 60000)
  if (!rateLimitResult.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user } = await requireApiAuth()

  // Get all invoices that aren't fully matched or paid
  const { data: invoices, error: fetchErr } = await supabase
    .from('invoices')
    .select('id, invoice_ref, po_id, grn_id, total_amount, gst_amount, vendor_invoice_no, match_status')
    .in('match_status', ['pending', 'partial_match', 'mismatch'])
    .neq('payment_status', 'paid')
    .limit(100)

  if (fetchErr) {
    return NextResponse.json({ error: `Failed to fetch invoices: ${fetchErr.message}` }, { status: 500 })
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({
      processed: 0,
      matched: 0, partial_match: 0, mismatch: 0, skipped: 0,
      message: 'No unmatched invoices found. All invoices are either matched or paid.',
    })
  }

  let matched = 0, partial = 0, mismatched = 0, skipped = 0

  for (const inv of invoices) {
    try {
      // Need both PO and GRN to match
      if (!inv.po_id && !inv.grn_id) {
        // No PO = No Payment — mark as mismatch
        await supabase.from('invoices').update({
          match_status: 'mismatch', updated_at: new Date().toISOString(),
        }).eq('id', inv.id)
        mismatched++
        continue
      }

      // If we have grn_id but no po_id, try to get po_id from the GRN
      let poId = inv.po_id
      if (!poId && inv.grn_id) {
        const { data: grn } = await supabase
          .from('grns').select('po_id').eq('id', inv.grn_id).single()
        poId = grn?.po_id
      }

      if (!poId) {
        await supabase.from('invoices').update({
          match_status: 'mismatch', updated_at: new Date().toISOString(),
        }).eq('id', inv.id)
        mismatched++
        continue
      }

      // Get PO items
      const { data: poItems } = await supabase
        .from('purchase_order_items')
        .select('item_id, ordered_qty, rate')
        .eq('po_id', poId)

      // Get ALL verified/submitted GRN items for this PO (not just one GRN)
      const { data: poGRNs } = await supabase
        .from('grns')
        .select('id')
        .eq('po_id', poId)
        .in('status', ['submitted', 'verified'])

      if (!poItems?.length || !poGRNs?.length) {
        skipped++
        continue
      }

      // Aggregate accepted qty across all GRNs
      const grnIds = poGRNs.map(g => g.id)
      const { data: grnItems } = await supabase
        .from('grn_items')
        .select('item_id, accepted_qty, rate')
        .in('grn_id', grnIds)

      const grnMap = new Map<string, { qty: number; rate: number }>()
      grnItems?.forEach((gi: any) => {
        const existing = grnMap.get(gi.item_id)
        if (existing) {
          existing.qty += (gi.accepted_qty || 0)
        } else {
          grnMap.set(gi.item_id, { qty: gi.accepted_qty || 0, rate: gi.rate || 0 })
        }
      })

      let allMatch = true
      let anyMatch = false

      for (const poItem of poItems) {
        const grn = grnMap.get(poItem.item_id)
        const grnQty = grn?.qty ?? 0
        const poQty = poItem.ordered_qty || 0
        const poRate = poItem.rate || 0
        const grnRate = grn?.rate ?? poRate

        const qtyOk = poQty > 0 && grnQty > 0
          && Math.abs(grnQty - poQty) / Math.max(poQty, 1) <= QTY_TOLERANCE
        const rateOk = poRate > 0
          && Math.abs(grnRate - poRate) / Math.max(poRate, 1) <= RATE_TOLERANCE

        if (qtyOk && rateOk) {
          anyMatch = true
        } else {
          allMatch = false
          if (qtyOk || rateOk) anyMatch = true
        }
      }

      // Determine status
      let matchStatus: string
      if (allMatch && poItems.length > 0) {
        matchStatus = 'matched'
        matched++
      } else if (anyMatch) {
        matchStatus = 'partial_match'
        partial++
      } else {
        matchStatus = 'mismatch'
        mismatched++
      }

      // Update invoice — only safe columns
      await supabase.from('invoices').update({
        match_status: matchStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', inv.id)

    } catch (err) {
      // Single invoice failure shouldn't kill the batch
      console.error(`[Batch Match] Invoice ${inv.id} failed:`, err)
      skipped++
    }
  }

  // Audit log (non-blocking)
  try {
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'batch_match',
      entity_type: 'invoice',
      details: { processed: invoices.length, matched, partial, mismatched, skipped },
    })
  } catch { /* non-critical */ }

  return NextResponse.json({
    processed: invoices.length,
    matched,
    partial_match: partial,
    mismatch: mismatched,
    skipped,
    message: `${matched} matched, ${partial} partial, ${mismatched} mismatch, ${skipped} skipped`,
  })
})
