import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { format } from 'date-fns'
import { withApiErrorHandler } from '@/lib/api-error-handler'

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const { supabase, user, userId } = await requireApiAuth()
  const { usage_id } = await request.json()
  if (!usage_id) return NextResponse.json({ error: 'usage_id required' }, { status: 400 })

  const { data: usage } = await supabase
    .from('consignment_usage')
    .select('*, stock:consignment_stock(*, item:items(id, item_code, generic_name, unit, hsn_code, gst_percent)), deposit:consignment_deposits(vendor_id, centre_id, challan_number)')
    .eq('id', usage_id).single()

  if (!usage) return NextResponse.json({ error: 'Usage not found' }, { status: 404 })
  if (usage.conversion_status === 'converted') return NextResponse.json({ error: 'Already converted' }, { status: 400 })

  const item = usage.stock?.item
  const vendorId = usage.deposit?.vendor_id
  const centreId = usage.deposit?.centre_id || usage.centre_id
  const qty = usage.qty_used || 1
  const rate = usage.stock?.vendor_rate || 0
  const gstPct = item?.gst_percent || 12
  const taxable = qty * rate
  const cgst = Math.round(taxable * gstPct / 200 * 100) / 100
  const sgst = cgst
  const total = Math.round((taxable + cgst + sgst) * 100) / 100

  const now = new Date()
  const yyMM = format(now, 'yyMM')

  // 1. PO
  const { count: poC } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
  const poNum = `H1-CPO-${yyMM}-${String((poC ?? 0) + 1).padStart(4, '0')}`

  const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({
    po_number: poNum, vendor_id: vendorId, centre_id: centreId,
    po_date: usage.usage_date || format(now, 'yyyy-MM-dd'),
    status: 'approved', po_type: 'consignment',
    subtotal: taxable, cgst_amount: cgst, sgst_amount: sgst,
    total_amount: total, net_amount: total,
    payment_terms: 'As per consignment agreement',
    notes: `Consignment usage ${usage.usage_number || ''}. Patient: ${usage.patient_name}. Challan: ${usage.deposit?.challan_number || 'N/A'}`,
    created_by: user.id, approved_by: user.id, approved_at: now.toISOString(),
  }).select().single()

  if (poErr || !po) return NextResponse.json({ error: 'PO failed: ' + poErr?.message }, { status: 500 })

  await supabase.from('purchase_order_items').insert({
    po_id: po.id, item_id: item.id, ordered_qty: qty, rate,
    trade_discount_percent: 0, net_rate: rate, gst_percent: gstPct,
    cgst_amount: cgst, sgst_amount: sgst, total_amount: total,
    unit: item.unit || 'Nos', hsn_code: item.hsn_code,
  })

  // 2. GRN
  const { count: grnC } = await supabase.from('grns').select('*', { count: 'exact', head: true })
  const grnNum = `H1-CGRN-${yyMM}-${String((grnC ?? 0) + 1).padStart(4, '0')}`

  const { data: grn, error: grnErr } = await supabase.from('grns').insert({
    grn_number: grnNum, po_id: po.id, vendor_id: vendorId, centre_id: centreId,
    grn_date: usage.usage_date || format(now, 'yyyy-MM-dd'),
    status: 'verified', quality_status: 'approved',
    cgst_amount: cgst, sgst_amount: sgst,
    total_amount: total, net_amount: total,
    dc_number: usage.deposit?.challan_number,
    notes: `Consignment. Patient: ${usage.patient_name}. Surgeon: ${usage.surgeon_name || 'N/A'}`,
    verified_by: user.id, received_by: user.id,
  }).select().single()

  if (grnErr || !grn) return NextResponse.json({ error: 'GRN failed: ' + grnErr?.message, po_id: po.id }, { status: 500 })

  await supabase.from('grn_items').insert({
    grn_id: grn.id, item_id: item.id,
    ordered_qty: qty, received_qty: qty, accepted_qty: qty,
    rejected_qty: 0, damaged_qty: 0, short_qty: 0,
    rate, gst_percent: gstPct, cgst_amount: cgst, sgst_amount: sgst,
    total_amount: total, batch_number: usage.stock?.batch_number,
    expiry_date: usage.stock?.expiry_date,
  })

  // 3. Invoice
  const { count: invC } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
  const invRef = `H1-CINV-${yyMM}-${String((invC ?? 0) + 1).padStart(4, '0')}`

  const { data: inv } = await supabase.from('invoices').insert({
    invoice_ref: invRef, po_id: po.id, grn_id: grn.id,
    vendor_id: vendorId, centre_id: centreId,
    vendor_invoice_date: usage.usage_date || format(now, 'yyyy-MM-dd'),
    total_amount: total, gst_amount: cgst + sgst,
    payment_status: 'unpaid', match_status: 'matched',
    due_date: format(new Date(now.getTime() + 30 * 86400000), 'yyyy-MM-dd'),
    match_notes: `Consignment. Patient: ${usage.patient_name}`,
    created_by: user.id,
  }).select().single()

  // 4. Update usage + stock + deposit
  await supabase.from('consignment_usage').update({
    conversion_status: 'converted', po_id: po.id, grn_id: grn.id, invoice_id: inv?.id,
  }).eq('id', usage_id)

  // Stock qty_used already deducted at usage recording time — just update status
  const { data: currentStock } = await supabase.from('consignment_stock')
    .select('qty_deposited, qty_used, qty_returned').eq('id', usage.stock_id).single()
  if (currentStock) {
    const allUsed = (currentStock.qty_used + currentStock.qty_returned) >= currentStock.qty_deposited
    await supabase.from('consignment_stock').update({
      status: allUsed ? 'used' : 'available',
    }).eq('id', usage.stock_id)
  }

  const { data: remain } = await supabase.from('consignment_stock')
    .select('qty_deposited, qty_used, qty_returned').eq('deposit_id', usage.deposit_id)
  const allDone = remain?.every(s => (s.qty_used + s.qty_returned) >= s.qty_deposited)
  await supabase.from('consignment_deposits').update({
    status: allDone ? 'fully_used' : 'partially_used',
  }).eq('id', usage.deposit_id)

  return NextResponse.json({
    success: true,
    po: { id: po.id, number: poNum },
    grn: { id: grn.id, number: grnNum },
    invoice: { id: inv?.id, ref: invRef },
    amount: total,
    message: `${poNum} → ${grnNum} → ${invRef} | ₹${total.toLocaleString('en-IN')}`,
  })
})
