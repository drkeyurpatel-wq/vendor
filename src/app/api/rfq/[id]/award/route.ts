import { requireApiAuthWithProfile } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { awardBlockedReason } from '@/lib/rfq'

/**
 * POST /api/rfq/[id]/award — award an RFQ to one vendor's quote.
 *
 * Server-side because awarding writes across three tables and must not leave a
 * second vendor still marked as awarded. The state rules live in
 * awardBlockedReason so they are unit-tested rather than only enforced in the UI.
 */
export const POST = withApiErrorHandler(async (req: NextRequest, context) => {
  const { supabase } = await requireApiAuthWithProfile()
  const params = await context?.params
  const rfqId = params?.id

  if (!rfqId) return NextResponse.json({ error: 'RFQ id required' }, { status: 400 })

  const body = await req.json()
  const quoteId = String(body.quote_id ?? '').trim()
  if (!quoteId) return NextResponse.json({ error: 'quote_id required' }, { status: 400 })

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .select('id, status')
    .eq('id', rfqId)
    .single()

  if (rfqError || !rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })

  const { data: quote } = await supabase
    .from('rfq_quotes')
    .select('id, rfq_id, vendor_id, status')
    .eq('id', quoteId)
    .single()

  // A quote belonging to a different RFQ is treated the same as a missing one,
  // so awarding cannot be redirected by passing an unrelated quote id.
  const quoteStatus = quote && quote.rfq_id === rfqId ? quote.status : undefined
  const blocked = awardBlockedReason(rfq.status, quoteStatus)
  if (blocked) return NextResponse.json({ error: blocked }, { status: 400 })

  const now = new Date().toISOString()

  const { error: winnerError } = await supabase
    .from('rfq_quotes')
    .update({ status: 'awarded', updated_at: now })
    .eq('id', quoteId)

  if (winnerError) {
    return NextResponse.json({ error: winnerError.message }, { status: 500 })
  }

  // Every other submitted quote on this RFQ is now rejected. Drafts are left
  // alone — the vendor never submitted them.
  const { error: othersError } = await supabase
    .from('rfq_quotes')
    .update({ status: 'rejected', updated_at: now })
    .eq('rfq_id', rfqId)
    .neq('id', quoteId)
    .in('status', ['submitted', 'under_evaluation', 'shortlisted'])

  if (othersError) {
    return NextResponse.json(
      { error: `Winner recorded but the other quotes could not be closed: ${othersError.message}` },
      { status: 500 }
    )
  }

  const { error: rfqUpdateError } = await supabase
    .from('rfqs')
    .update({
      status: 'awarded',
      awarded_vendor_id: quote!.vendor_id,
      awarded_at: now,
      closed_at: now,
      updated_at: now,
    })
    .eq('id', rfqId)

  if (rfqUpdateError) {
    return NextResponse.json(
      { error: `Quotes updated but the RFQ could not be closed: ${rfqUpdateError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, awarded_vendor_id: quote!.vendor_id })
})
