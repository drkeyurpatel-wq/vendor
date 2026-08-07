import { requireApiAuthWithProfile } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { withApiErrorHandler } from '@/lib/api-error-handler'

interface IncomingItem {
  item_id?: string | null
  description?: string
  quantity?: number
  unit?: string
  specifications?: string | null
}

/**
 * POST /api/rfq — create an RFQ with its line items.
 *
 * Server-side so the RFQ number is allocated once, the line items are written
 * with the columns the database actually requires, and a half-written RFQ with
 * no items cannot be left behind if the second insert fails.
 */
export const POST = withApiErrorHandler(async (req: NextRequest) => {
  const { supabase, userId, centreId, isGroupLevel } = await requireApiAuthWithProfile()
  const body = await req.json()

  const title = String(body.title ?? '').trim()
  const submissionDeadline = String(body.submission_deadline ?? '').trim()
  const rawItems: IncomingItem[] = Array.isArray(body.items) ? body.items : []

  if (!title) {
    return NextResponse.json({ error: 'A title is required' }, { status: 400 })
  }
  if (!submissionDeadline) {
    return NextResponse.json({ error: 'A submission deadline is required' }, { status: 400 })
  }
  if (Number.isNaN(new Date(submissionDeadline).getTime())) {
    return NextResponse.json({ error: 'The submission deadline is not a valid date' }, { status: 400 })
  }

  // Normalise before validating so a line that is blank in every field is
  // treated as an empty row rather than a validation failure.
  const items = rawItems
    .map(it => ({
      item_id: it.item_id || null,
      description: String(it.description ?? '').trim(),
      quantity: Number(it.quantity ?? 0),
      unit: String(it.unit ?? '').trim(),
      specifications: it.specifications ? String(it.specifications).trim() : null,
    }))
    .filter(it => it.description || it.quantity > 0 || it.unit)

  if (items.length === 0) {
    return NextResponse.json({ error: 'Add at least one item to the RFQ' }, { status: 400 })
  }

  // description, quantity and unit are all NOT NULL on rfq_items.
  const invalid = items.find(it => !it.description || !(it.quantity > 0) || !it.unit)
  if (invalid) {
    return NextResponse.json(
      { error: 'Every item needs a description, a quantity above zero, and a unit' },
      { status: 400 }
    )
  }

  // A centre-scoped user can only raise an RFQ for their own centre.
  const centre_id = isGroupLevel ? (body.centre_id || null) : centreId
  if (!isGroupLevel && body.centre_id && body.centre_id !== centreId) {
    return NextResponse.json({ error: 'You can only raise an RFQ for your own centre' }, { status: 403 })
  }

  const status = body.status === 'draft' ? 'draft' : 'open'

  // Allocate the number through the shared sequence endpoint's RPC so RFQs
  // follow the same H1-<centre>-RFQ-<yymm>-<nnn> shape as POs and GRNs.
  let centreCode = 'XXX'
  if (centre_id) {
    const { data: centre } = await supabase.from('centres').select('code').eq('id', centre_id).single()
    if (centre?.code) centreCode = centre.code
  }

  let rfqNumber: string
  const { data: seq } = await supabase.rpc('next_sequence_number', {
    seq_name: 'rfq_number_seq',
    seq_type: 'rfq',
    centre_code: centreCode,
  })
  if (seq) {
    rfqNumber = seq as unknown as string
  } else {
    const { data: latest } = await supabase
      .from('rfqs')
      .select('rfq_number')
      .order('rfq_number', { ascending: false })
      .limit(1)
    const lastNum = latest?.[0]?.rfq_number?.match(/(\d+)$/)?.[1]
    const next = (lastNum ? parseInt(lastNum, 10) : 0) + 1
    const now = new Date()
    const ym = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0')
    rfqNumber = `H1-${centreCode}-RFQ-${ym}-${String(next).padStart(3, '0')}`
  }

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .insert({
      rfq_number: rfqNumber,
      title,
      description: body.description ? String(body.description).trim() : null,
      status,
      centre_id,
      category_id: body.category_id || null,
      submission_deadline: new Date(submissionDeadline).toISOString(),
      delivery_required_by: body.delivery_required_by || null,
      terms_and_conditions: body.terms_and_conditions ? String(body.terms_and_conditions).trim() : null,
      created_by: userId,
    })
    .select('id, rfq_number')
    .single()

  if (rfqError || !rfq) {
    return NextResponse.json({ error: rfqError?.message || 'Could not create the RFQ' }, { status: 500 })
  }

  const { error: itemsError } = await supabase.from('rfq_items').insert(
    items.map((it, idx) => ({
      rfq_id: rfq.id,
      item_id: it.item_id,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      specifications: it.specifications,
      sort_order: idx,
    }))
  )

  if (itemsError) {
    // Without items the RFQ is meaningless and vendors would see an empty
    // request, so roll it back rather than leaving a broken shell behind.
    await supabase.from('rfqs').delete().eq('id', rfq.id)
    return NextResponse.json(
      { error: `Could not save the RFQ items: ${itemsError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: rfq.id, rfq_number: rfq.rfq_number, items: items.length })
})
