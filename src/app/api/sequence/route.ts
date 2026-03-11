import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Atomic sequence generator using DB sequences.
 * GET /api/sequence?type=po&centre_code=SHI
 * Returns { number: "H1-SHI-PO-2603-001" }
 */
export async function GET(req: NextRequest) {
  const rateLimitResult = await rateLimit(req, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const type = req.nextUrl.searchParams.get('type')
  const centreCode = req.nextUrl.searchParams.get('centre_code') || 'XXX'

  if (!type) {
    return NextResponse.json({ error: 'type param required' }, { status: 400 })
  }

  const sequenceMap: Record<string, string> = {
    vendor: 'vendor_code_seq',
    item: 'item_code_seq',
    po: 'po_number_seq',
    grn: 'grn_number_seq',
    indent: 'indent_number_seq',
    invoice: 'invoice_ref_seq',
    batch: 'batch_number_seq',
  }

  const seqName = sequenceMap[type]
  if (!seqName) {
    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('next_sequence_number', {
    seq_name: seqName,
    seq_type: type,
    centre_code: centreCode,
  })

  if (error) {
    // Fallback: use count-based if the RPC doesn't exist yet
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ number: data })
}
