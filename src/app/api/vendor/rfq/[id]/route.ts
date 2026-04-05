import { NextRequest, NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Get RFQ — only show if status is open/evaluation (vendor-visible)
  const { data: rfq } = await session.supabase
    .from('rfqs')
    .select('*, centre:centres(code, name)')
    .eq('id', id)
    .in('status', ['open', 'evaluation', 'awarded', 'closed'])
    .single()

  if (!rfq) {
    return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
  }

  // Verify vendor category matches RFQ (if RFQ has a category filter)
  if (rfq.category_id) {
    const { data: vendor } = await session.supabase
      .from('vendors')
      .select('category_id')
      .eq('id', session.vendorId)
      .single()
    if (vendor && vendor.category_id !== rfq.category_id) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }
  }

  // Get RFQ items
  const { data: items } = await session.supabase
    .from('rfq_items')
    .select('*')
    .eq('rfq_id', id)
    .order('sort_order', { ascending: true })

  // Get existing quote from this vendor
  const { data: existingQuote } = await session.supabase
    .from('rfq_quotes')
    .select('*')
    .eq('rfq_id', id)
    .eq('vendor_id', session.vendorId)
    .single()

  let existingQuoteItems: any[] = []
  if (existingQuote) {
    const { data } = await session.supabase
      .from('rfq_quote_items')
      .select('*')
      .eq('quote_id', existingQuote.id)
    existingQuoteItems = data || []
  }

  return NextResponse.json({
    rfq,
    items: items || [],
    existing_quote: existingQuote,
    existing_quote_items: existingQuoteItems,
  })
}
