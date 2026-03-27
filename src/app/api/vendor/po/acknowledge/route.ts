import { NextRequest, NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function POST(request: NextRequest) {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { po_id, vendor_id, delivery_date, notes } = await request.json()

    if (!po_id || !delivery_date) {
      return NextResponse.json({ error: 'PO ID and delivery date required' }, { status: 400 })
    }

    // Verify PO belongs to this vendor
    const { data: po, error: poErr } = await session.supabase
      .from('purchase_orders')
      .select('id, status, vendor_id')
      .eq('id', po_id)
      .eq('vendor_id', session.vendorId)
      .is('deleted_at', null)
      .single()

    if (poErr || !po) {
      return NextResponse.json({ error: 'PO not found or access denied' }, { status: 404 })
    }

    if (!['approved', 'sent_to_vendor'].includes(po.status)) {
      return NextResponse.json({ error: 'PO is not in a state that can be acknowledged' }, { status: 400 })
    }

    // Update PO
    const { error: updateErr } = await session.supabase
      .from('purchase_orders')
      .update({
        vendor_acknowledged: true,
        vendor_acknowledged_at: new Date().toISOString(),
        vendor_confirmed_delivery_date: delivery_date,
        vendor_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', po_id)

    if (updateErr) {
      console.error('[Vendor Acknowledge] Update error:', updateErr)
      return NextResponse.json({ error: 'Failed to acknowledge PO' }, { status: 500 })
    }

    // Log activity
    await session.supabase.from('activity_log').insert({
      table_name: 'purchase_orders',
      record_id: po_id,
      action: 'vendor_acknowledged',
      changes: { delivery_date, notes },
      performed_by: session.vendorId,
    }).catch(() => {}) // Non-critical

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[Vendor Acknowledge] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
