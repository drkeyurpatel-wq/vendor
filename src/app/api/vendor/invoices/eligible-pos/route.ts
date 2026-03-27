import { NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function GET() {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: pos } = await session.supabase
    .from('purchase_orders')
    .select('id, po_number, po_date, total_amount, centre:centres(code)')
    .eq('vendor_id', session.vendorId)
    .in('status', ['approved', 'sent_to_vendor', 'partially_received', 'fully_received'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ pos: pos || [] })
}
