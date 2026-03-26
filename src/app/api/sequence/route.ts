import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth'
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

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  if (!error && data) {
    return NextResponse.json({ number: data })
  }

  // Fallback: count-based numbering if RPC/sequence doesn't exist
  try {
    const tableMap: Record<string, string> = {
      vendor: 'vendors', item: 'items', po: 'purchase_orders',
      grn: 'grns', indent: 'purchase_indents', invoice: 'invoices', batch: 'payment_batches',
    }
    const table = tableMap[type]
    if (!table) {
      return NextResponse.json({ error: `No fallback for type: ${type}` }, { status: 500 })
    }
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    const seq = (count ?? 0) + 1
    const ym = new Date().toISOString().slice(2, 4) + String(new Date().getMonth() + 1).padStart(2, '0')

    const formatMap: Record<string, string> = {
      vendor: `H1V-${String(seq).padStart(4, '0')}`,
      item: `H1I-${String(seq).padStart(5, '0')}`,
      po: `H1-${centreCode}-PO-${ym}-${String(seq).padStart(3, '0')}`,
      grn: `H1-${centreCode}-GRN-${ym}-${String(seq).padStart(3, '0')}`,
      indent: `H1-${centreCode}-IND-${ym}-${String(seq).padStart(3, '0')}`,
      invoice: `H1-${centreCode}-INV-${ym}-${String(seq).padStart(3, '0')}`,
      batch: `H1-PAY-${ym}-${String(seq).padStart(3, '0')}`,
    }

    const number = formatMap[type]
    if (number) {
      return NextResponse.json({ number })
    }
    return NextResponse.json({ error: error?.message || 'Sequence failed' }, { status: 500 })
  } catch (fallbackErr: any) {
    return NextResponse.json({ error: error?.message || fallbackErr?.message || 'Sequence failed' }, { status: 500 })
  }
}
