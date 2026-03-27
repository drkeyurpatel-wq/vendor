import { NextRequest, NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function POST(request: NextRequest) {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { po_id, vendor_invoice_no, vendor_invoice_date, subtotal, gst_amount, total_amount, invoice_file_path } = body

    if (!po_id || !vendor_invoice_no || !vendor_invoice_date || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify PO belongs to vendor
    const { data: po } = await session.supabase
      .from('purchase_orders')
      .select('id, po_number, centre_id, vendor_id, total_amount, status')
      .eq('id', po_id)
      .eq('vendor_id', session.vendorId)
      .is('deleted_at', null)
      .single()

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check for duplicate invoice number from this vendor
    const { data: existing } = await session.supabase
      .from('invoices')
      .select('id')
      .eq('vendor_id', session.vendorId)
      .eq('vendor_invoice_no', vendor_invoice_no)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Invoice ${vendor_invoice_no} already exists. Duplicate submission blocked.` }, { status: 409 })
    }

    // Generate invoice reference
    const { data: seq } = await session.supabase.rpc('get_next_sequence', { p_type: 'invoice' }).single()
    const invoiceRef = `H1-INV-${String(seq?.val || Date.now()).padStart(6, '0')}`

    // Get vendor credit period
    const { data: vendor } = await session.supabase
      .from('vendors')
      .select('credit_period_days')
      .eq('id', session.vendorId)
      .single()

    const creditDays = vendor?.credit_period_days || 30
    const dueDate = new Date(vendor_invoice_date)
    dueDate.setDate(dueDate.getDate() + creditDays)

    // Simple 3-way match check
    const amountDiff = Math.abs(total_amount - Number(po.total_amount))
    const amountMatch = amountDiff < 1 // Within ₹1 tolerance
    const matchStatus = amountMatch ? 'matched' : (amountDiff / Number(po.total_amount) < 0.05 ? 'partial_match' : 'mismatch')

    // Create invoice
    const { data: invoice, error: insertErr } = await session.supabase
      .from('invoices')
      .insert({
        invoice_ref: invoiceRef,
        vendor_invoice_no,
        vendor_invoice_date,
        centre_id: po.centre_id,
        vendor_id: session.vendorId,
        po_id,
        subtotal: subtotal || 0,
        gst_amount: gst_amount || 0,
        total_amount,
        match_status: matchStatus,
        match_notes: amountMatch ? 'Amount matches PO' : `Amount differs from PO by ${((amountDiff / Number(po.total_amount)) * 100).toFixed(1)}%`,
        qty_match: null, // Will be verified by admin
        rate_match: amountMatch,
        gst_match: null,
        duplicate_check: true,
        credit_period_days: creditDays,
        due_date: dueDate.toISOString().split('T')[0],
        payment_status: 'unpaid',
        invoice_file_path,
        status: 'pending',
        created_by: session.vendorId,
      })
      .select('id, invoice_ref')
      .single()

    if (insertErr) {
      console.error('[Invoice Submit] Error:', insertErr)
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Log activity
    await session.supabase.from('activity_log').insert({
      table_name: 'invoices',
      record_id: invoice.id,
      action: 'vendor_invoice_submitted',
      changes: { vendor_invoice_no, total_amount, match_status: matchStatus },
      performed_by: session.vendorId,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      invoice_ref: invoice.invoice_ref,
      match_status: matchStatus,
    })
  } catch (err: any) {
    console.error('[Invoice Submit] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
