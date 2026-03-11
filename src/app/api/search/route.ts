import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

interface SearchResult {
  id: string
  type: 'vendor' | 'item' | 'purchase_order' | 'grn' | 'invoice'
  title: string
  subtitle: string | null
}

export async function GET(request: NextRequest) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = await rateLimit(request, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    )
  }

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get search query
  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const searchTerm = `%${q.trim()}%`
  const results: SearchResult[] = []

  // Search vendors (legal_name, vendor_code, gstin)
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, legal_name, vendor_code')
    .or(`legal_name.ilike.${searchTerm},vendor_code.ilike.${searchTerm},gstin.ilike.${searchTerm}`)
    .is('deleted_at', null)
    .limit(5)

  if (vendors) {
    for (const v of vendors) {
      results.push({
        id: v.id,
        type: 'vendor',
        title: v.legal_name,
        subtitle: v.vendor_code,
      })
    }
  }

  // Search items (generic_name, item_code, brand_name)
  const { data: items } = await supabase
    .from('items')
    .select('id, generic_name, item_code')
    .or(`generic_name.ilike.${searchTerm},item_code.ilike.${searchTerm},brand_name.ilike.${searchTerm}`)
    .is('deleted_at', null)
    .limit(5)

  if (items) {
    for (const i of items) {
      results.push({
        id: i.id,
        type: 'item',
        title: i.generic_name,
        subtitle: i.item_code,
      })
    }
  }

  // Search purchase orders (po_number)
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status')
    .ilike('po_number', searchTerm)
    .is('deleted_at', null)
    .limit(5)

  if (pos) {
    for (const po of pos) {
      results.push({
        id: po.id,
        type: 'purchase_order',
        title: po.po_number,
        subtitle: po.status,
      })
    }
  }

  // Search GRNs (grn_number)
  const { data: grns } = await supabase
    .from('grns')
    .select('id, grn_number, status')
    .ilike('grn_number', searchTerm)
    .limit(5)

  if (grns) {
    for (const g of grns) {
      results.push({
        id: g.id,
        type: 'grn',
        title: g.grn_number,
        subtitle: g.status,
      })
    }
  }

  // Search invoices (invoice_ref, vendor_invoice_no)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref')
    .or(`invoice_ref.ilike.${searchTerm},vendor_invoice_no.ilike.${searchTerm}`)
    .limit(5)

  if (invoices) {
    for (const inv of invoices) {
      results.push({
        id: inv.id,
        type: 'invoice',
        title: inv.invoice_ref,
        subtitle: null,
      })
    }
  }

  return NextResponse.json(
    { results, total: results.length },
    {
      headers: {
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.reset),
      },
    }
  )
}
