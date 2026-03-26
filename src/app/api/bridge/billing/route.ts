import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBridge, bridgeSuccess, bridgeError } from '@/lib/bridge-auth'
import { format } from 'date-fns'
import { withApiErrorHandler } from '@/lib/api-error-handler'

/**
 * FLOW A: Patient Billing → Consignment Conversion
 *
 * HMIS sends this when a consignment item is billed to a patient.
 * VPMS auto-creates: PO + GRN + Invoice from the consignment usage.
 *
 * HMIS payload:
 * {
 *   patient_name: "Rajesh Patel",
 *   patient_uhid: "SHI-2026-12345",
 *   item_code: "H1I-00042",           // VPMS item code
 *   serial_number: "SN-MED-DES-001",  // Stent serial (optional)
 *   batch_number: "LOT-2026-A",       // Batch (optional)
 *   qty: 1,
 *   surgeon_name: "Dr. Sunil Gurmukhani",
 *   procedure: "PCI / Angioplasty",
 *   ot_location: "Cathlab 1",
 *   centre_code: "SHI",
 *   billing_date: "2026-03-25",
 *   bill_number: "SHI-BILL-2026-4521"  // HMIS bill reference
 * }
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const authErr = validateBridge(request)
  if (authErr) return authErr

  const body = await request.json()
  const { patient_name, patient_uhid, item_code, serial_number, batch_number, qty,
    surgeon_name, procedure, ot_location, centre_code, billing_date, bill_number } = body

  if (!patient_name || !item_code || !centre_code) {
    return bridgeError('billing_to_consignment', 'patient_name, item_code, centre_code required')
  }

  const supabase = await createClient()

  // Find centre
  const { data: centre } = await supabase.from('centres').select('id').eq('code', centre_code).single()
  if (!centre) return bridgeError('billing_to_consignment', `Centre ${centre_code} not found`)

  // Find consignment stock item
  let stockQuery = supabase.from('consignment_stock')
    .select('*, deposit:consignment_deposits(vendor_id, centre_id, challan_number)')
    .eq('status', 'available')

  // Match by serial number (most specific) > batch > item_code
  if (serial_number) {
    stockQuery = stockQuery.eq('serial_number', serial_number)
  } else if (batch_number) {
    const { data: item } = await supabase.from('items').select('id').eq('item_code', item_code).single()
    if (!item) return bridgeError('billing_to_consignment', `Item ${item_code} not found in VPMS`)
    stockQuery = stockQuery.eq('item_id', item.id).eq('batch_number', batch_number)
  } else {
    const { data: item } = await supabase.from('items').select('id').eq('item_code', item_code).single()
    if (!item) return bridgeError('billing_to_consignment', `Item ${item_code} not found in VPMS`)
    stockQuery = stockQuery.eq('item_id', item.id)
  }

  const { data: stockItems } = await stockQuery.limit(1)
  const stock = stockItems?.[0]

  if (!stock) {
    return bridgeError('billing_to_consignment', `No available consignment stock for ${item_code}${serial_number ? ` SN:${serial_number}` : ''}`)
  }

  const avail = stock.qty_deposited - stock.qty_used - stock.qty_returned
  const useQty = qty || 1
  if (useQty > avail) {
    return bridgeError('billing_to_consignment', `Only ${avail} available, requested ${useQty}`)
  }

  // Create usage record
  const now = new Date()
  const yyMM = format(now, 'yyMM')
  const { count } = await supabase.from('consignment_usage').select('*', { count: 'exact', head: true })
  const usageNum = `H1-CU-${yyMM}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data: usage, error: usageErr } = await supabase.from('consignment_usage').insert({
    usage_number: usageNum,
    stock_id: stock.id,
    deposit_id: stock.deposit_id,
    centre_id: centre.id,
    patient_name,
    patient_uhid: patient_uhid || null,
    surgeon_name: surgeon_name || null,
    ot_number: ot_location || null,
    case_type: procedure || null,
    usage_date: billing_date || format(now, 'yyyy-MM-dd'),
    qty_used: useQty,
    conversion_status: 'pending',
    notes: bill_number ? `HMIS Bill: ${bill_number}` : 'Auto-created from HMIS billing',
  }).select().single()

  if (usageErr) return bridgeError('billing_to_consignment', 'Usage creation failed: ' + usageErr.message, 500)

  // Auto-convert to PO+GRN+Invoice
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  const convertRes = await fetch(`${baseUrl}/api/consignment/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
    body: JSON.stringify({ usage_id: usage.id }),
  })
  const convertData = await convertRes.json()

  if (!convertRes.ok) {
    return bridgeSuccess('billing_to_consignment', {
      usage_id: usage.id, usage_number: usageNum,
      conversion: 'pending',
      note: 'Usage created but auto-conversion failed — accounts team can convert manually',
      error: convertData.error,
    })
  }

  return bridgeSuccess('billing_to_consignment', {
    usage_id: usage.id,
    usage_number: usageNum,
    po: convertData.po,
    grn: convertData.grn,
    invoice: convertData.invoice,
    amount: convertData.amount,
    message: `Consignment billed: ${patient_name} → ${convertData.message}`,
  })
})
