import { NextRequest, NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function POST(request: NextRequest) {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { po_id, vendor_id, reason } = await request.json()

    if (!po_id || !reason?.trim()) {
      return NextResponse.json({ error: 'PO ID and dispute reason required' }, { status: 400 })
    }

    const { data: po } = await session.supabase
      .from('purchase_orders')
      .select('id, status, vendor_id')
      .eq('id', po_id)
      .eq('vendor_id', session.vendorId)
      .is('deleted_at', null)
      .single()

    if (!po) {
      return NextResponse.json({ error: 'PO not found or access denied' }, { status: 404 })
    }

    const { error: updateErr } = await session.supabase
      .from('purchase_orders')
      .update({
        vendor_dispute: true,
        vendor_dispute_reason: reason.trim(),
        vendor_dispute_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', po_id)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to raise dispute' }, { status: 500 })
    }

    await session.supabase.from('activity_log').insert({
      table_name: 'purchase_orders',
      record_id: po_id,
      action: 'vendor_dispute_raised',
      changes: { reason },
      performed_by: session.vendorId,
    })
    // Non-critical: activity log failure is silent

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
