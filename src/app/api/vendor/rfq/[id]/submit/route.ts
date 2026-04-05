import { NextRequest, NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rfqId } = await params

  try {
    const body = await request.json()
    const { items, payment_terms, validity_days, delivery_timeline_days, notes, total_amount } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item quote is required' }, { status: 400 })
    }

    // Validate financial amounts (zero-error math policy)
    if (total_amount !== undefined && (typeof total_amount !== 'number' || total_amount < 0 || total_amount > 100_000_000)) {
      return NextResponse.json({ error: 'Total amount must be a non-negative number up to 10 crore' }, { status: 400 })
    }
    for (const item of items) {
      if (item.unit_rate !== undefined && (typeof item.unit_rate !== 'number' || item.unit_rate < 0)) {
        return NextResponse.json({ error: 'Unit rate must be a non-negative number' }, { status: 400 })
      }
    }

    // Verify RFQ is open
    const { data: rfq } = await session.supabase
      .from('rfqs')
      .select('id, status, submission_deadline')
      .eq('id', rfqId)
      .single()

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    if (rfq.status !== 'open') {
      return NextResponse.json({ error: 'This RFQ is no longer accepting quotes' }, { status: 400 })
    }

    if (new Date(rfq.submission_deadline) < new Date()) {
      return NextResponse.json({ error: 'Submission deadline has passed' }, { status: 400 })
    }

    // Check for existing quote (upsert)
    const { data: existingQuote } = await session.supabase
      .from('rfq_quotes')
      .select('id')
      .eq('rfq_id', rfqId)
      .eq('vendor_id', session.vendorId)
      .single()

    let quoteId: string

    if (existingQuote) {
      // Update existing quote
      const { error: updateErr } = await session.supabase
        .from('rfq_quotes')
        .update({
          total_amount,
          delivery_timeline_days,
          payment_terms,
          validity_days: validity_days || 30,
          notes,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingQuote.id)

      if (updateErr) throw updateErr
      quoteId = existingQuote.id

      // Delete old line items
      await session.supabase.from('rfq_quote_items').delete().eq('quote_id', quoteId)
    } else {
      // Create new quote
      const { data: newQuote, error: insertErr } = await session.supabase
        .from('rfq_quotes')
        .insert({
          rfq_id: rfqId,
          vendor_id: session.vendorId,
          total_amount,
          delivery_timeline_days,
          payment_terms,
          validity_days: validity_days || 30,
          notes,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertErr || !newQuote) throw insertErr || new Error('Failed to create quote')
      quoteId = newQuote.id
    }

    // Insert line items
    const lineItems = items.map((item: any) => ({
      quote_id: quoteId,
      rfq_item_id: item.rfq_item_id,
      unit_rate: item.unit_rate,
      gst_percent: item.gst_percent || 0,
      total_amount: item.unit_rate * (1 + (item.gst_percent || 0) / 100), // per-unit total
      brand: item.brand || null,
      manufacturer: item.manufacturer || null,
      delivery_days: item.delivery_days || null,
      remarks: item.remarks || null,
    }))

    const { error: itemsErr } = await session.supabase
      .from('rfq_quote_items')
      .insert(lineItems)

    if (itemsErr) throw itemsErr

    // Activity log
    await session.supabase.from('activity_log').insert({
      table_name: 'rfq_quotes',
      record_id: quoteId,
      action: 'vendor_quote_submitted',
      changes: { rfq_id: rfqId, total_amount, items_count: items.length },
      performed_by: session.vendorId,
    })
    // Non-critical: activity log failure is silent

    return NextResponse.json({ success: true, quote_id: quoteId })
  } catch (err: any) {
    console.error('[RFQ Submit] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
