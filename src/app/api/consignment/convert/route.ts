import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

// ============================================================
// H1 VPMS — Consignment Auto-Convert
// Usage logged → Creates PO + GRN automatically
// PO dated = procedure date (retroactive)
// GRN dated = procedure date (goods already received)
// ============================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { usage_id } = await request.json()
  if (!usage_id) return NextResponse.json({ error: 'usage_id required' }, { status: 400 })

  // Get usage with stock + deposit details
  const { data: usage } = await supabase.from('consignment_usage')
    .select('*, stock:consignment_stock(*, deposit:consignment_deposits(vendor_id, centre_id, challan_number))')
    .eq('id', usage_id).single()

  if (!usage || !usage.stock) return NextResponse.json({ error: 'Usage not found' }, { status: 404 })
  if (usage.conversion_status !== 'pending') return NextResponse.json({ error: 'Already converted' }, { status: 400 })

  const stock = usage.stock
  const deposit = stock.deposit
  const vendorId = deposit.vendor_id
  const centreId = usage.centre_id || deposit.centre_id
  const procedureDate = usage.procedure_date

  try {
    // 1. Generate PO number
    const yyMM = format(new Date(procedureDate), 'yyMM')
    const { count: poCount } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
    const poNumber = `H1-CON-PO-${yyMM}-${String((poCount ?? 0) + 1).padStart(4, '0')}`

    // Create PO
    const rate = stock.vendor_rate || 0
    const gstPct = stock.gst_percent || 12
    const qty = usage.qty_used || 1
    const subtotal = rate * qty
    const gstAmt = subtotal * gstPct / 100
    const cgst = gstAmt / 2
    const sgst = gstAmt / 2
    const total = subtotal + gstAmt

    const { data: po, error: poError } = await supabase.from('purchase_orders').insert({
      po_number: poNumber,
      vendor_id: vendorId,
      centre_id: centreId,
      po_date: procedureDate,
      expected_delivery_date: procedureDate, // Already delivered
      status: 'approved', // Auto-approved — goods already used
      po_type: 'consignment',
      subtotal,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_amount: total,
      net_amount: total,
      payment_terms: 'As per consignment agreement',
      notes: `Auto-generated from consignment usage. Patient: ${usage.patient_name}. Surgeon: ${usage.surgeon_name}. Challan: ${deposit.challan_number}`,
      created_by: user.id,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      current_approval_level: 4, // Auto-approved
    }).select('id').single()

    if (poError || !po) throw new Error(poError?.message || 'PO creation failed')

    // Create PO line item
    await supabase.from('purchase_order_items').insert({
      po_id: po.id,
      item_id: stock.item_id || null,
      item_description: stock.item_description,
      ordered_qty: qty,
      rate,
      discount_percent: 0,
      trade_discount_percent: 0,
      net_rate: rate,
      gst_percent: gstPct,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_amount: total,
      unit: 'Nos',
    })

    // Update usage with PO
    await supabase.from('consignment_usage').update({ auto_po_id: po.id, conversion_status: 'po_created' }).eq('id', usage_id)

    // 2. Generate GRN
    const { count: grnCount } = await supabase.from('grns').select('*', { count: 'exact', head: true })
    const grnNumber = `H1-CON-GRN-${yyMM}-${String((grnCount ?? 0) + 1).padStart(4, '0')}`

    const { data: grn, error: grnError } = await supabase.from('grns').insert({
      grn_number: grnNumber,
      po_id: po.id,
      vendor_id: vendorId,
      centre_id: centreId,
      grn_date: procedureDate,
      status: 'verified',
      quality_status: 'accepted',
      dc_number: deposit.challan_number,
      vendor_invoice_no: null, // Invoice comes later from accounts
      subtotal,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_amount: total,
      net_amount: total,
      notes: `Auto-generated from consignment usage. Serial: ${stock.serial_number || 'N/A'}`,
      received_by: user.id,
    }).select('id').single()

    if (grnError || !grn) throw new Error(grnError?.message || 'GRN creation failed')

    // Create GRN line item
    await supabase.from('grn_items').insert({
      grn_id: grn.id,
      item_id: stock.item_id || null,
      ordered_qty: qty,
      received_qty: qty,
      accepted_qty: qty,
      rejected_qty: 0,
      damaged_qty: 0,
      short_qty: 0,
      rate,
      gst_percent: gstPct,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total_amount: total,
      batch_number: stock.batch_number || stock.serial_number,
      expiry_date: stock.expiry_date,
    })

    // Update PO status
    await supabase.from('purchase_orders').update({ status: 'partially_received' }).eq('id', po.id)

    // Update usage with GRN
    await supabase.from('consignment_usage').update({
      auto_grn_id: grn.id,
      conversion_status: 'grn_created',
    }).eq('id', usage_id)

    return NextResponse.json({
      success: true,
      po_id: po.id, po_number: poNumber,
      grn_id: grn.id, grn_number: grnNumber,
      total_amount: total,
      message: `PO ${poNumber} + GRN ${grnNumber} created for ${stock.item_description}`,
    })
  } catch (err: any) {
    await supabase.from('consignment_usage').update({ conversion_status: 'failed' }).eq('id', usage_id)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
