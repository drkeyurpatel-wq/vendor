import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBridge, bridgeSuccess, bridgeError } from '@/lib/bridge-auth'
import { withApiErrorHandler } from '@/lib/api-error-handler'

/**
 * FLOW C: OT/Procedure Consumption → VPMS Stock Deduction
 *
 * HMIS sends this when items are consumed during a procedure (OT, cathlab,
 * endoscopy, etc.) — NOT consignment items (those go through Flow A).
 * This is for regular stock: sutures, gloves, surgical kits, etc.
 *
 * HMIS payload:
 * {
 *   centre_code: "SHI",
 *   patient_name: "Rajesh Patel",
 *   patient_uhid: "SHI-2026-12345",
 *   procedure: "Laparoscopic Cholecystectomy",
 *   ot_location: "OT-2",
 *   surgeon: "Dr. Amit Patel",
 *   consumption_date: "2026-03-25",
 *   items: [
 *     { item_code: "H1I-00010", qty: 5, batch_number: "B123" },
 *     { item_code: "H1I-00022", qty: 2 }
 *   ]
 * }
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const authErr = validateBridge(request)
  if (authErr) return authErr

  const body = await request.json()
  const { centre_code, patient_name, patient_uhid, procedure, ot_location,
    surgeon, consumption_date, items } = body

  if (!centre_code || !items?.length) {
    return bridgeError('ot_consumption', 'centre_code and items[] required')
  }

  const supabase = await createClient()

  const { data: centre } = await supabase.from('centres').select('id').eq('code', centre_code).single()
  if (!centre) return bridgeError('ot_consumption', `Centre ${centre_code} not found`)

  // Resolve items
  const itemCodes = items.map((i: any) => i.item_code)
  const { data: vpmsItems } = await supabase.from('items')
    .select('id, item_code, generic_name')
    .in('item_code', itemCodes)
  const itemMap = new Map((vpmsItems || []).map(i => [i.item_code, i]))

  const deducted: any[] = []
  const failed: any[] = []

  for (const line of items) {
    const vpmsItem = itemMap.get(line.item_code)
    if (!vpmsItem) {
      failed.push({ item_code: line.item_code, reason: 'Item not found in VPMS' })
      continue
    }

    // Get current stock at centre
    const { data: stock } = await supabase.from('item_centre_stock')
      .select('id, current_stock')
      .eq('item_id', vpmsItem.id)
      .eq('centre_id', centre.id)
      .single()

    if (!stock) {
      failed.push({ item_code: line.item_code, reason: 'No stock record at this centre' })
      continue
    }

    const qtyToDeduct = line.qty || 1
    if (stock.current_stock < qtyToDeduct) {
      failed.push({
        item_code: line.item_code, reason: `Insufficient stock: ${stock.current_stock} available, ${qtyToDeduct} requested`,
        current_stock: stock.current_stock,
      })
      // Still deduct what's available
      if (stock.current_stock > 0) {
        await supabase.from('item_centre_stock').update({
          current_stock: 0,
        }).eq('id', stock.id)
        deducted.push({ item_code: line.item_code, qty_deducted: stock.current_stock, partial: true })
      }
      continue
    }

    // Deduct stock
    await supabase.from('item_centre_stock').update({
      current_stock: stock.current_stock - qtyToDeduct,
    }).eq('id', stock.id)

    deducted.push({ item_code: line.item_code, name: vpmsItem.generic_name, qty_deducted: qtyToDeduct })

    // If batch specified, deduct from batch_stock too
    if (line.batch_number) {
      const { data: batchStock } = await supabase.from('batch_stock')
        .select('id, qty_available')
        .eq('item_id', vpmsItem.id)
        .eq('centre_id', centre.id)
        .eq('batch_number', line.batch_number)
        .single()

      if (batchStock && batchStock.qty_available >= qtyToDeduct) {
        await supabase.from('batch_stock').update({
          qty_available: batchStock.qty_available - qtyToDeduct,
        }).eq('id', batchStock.id)
      }
    }
  }

  // Log consumption event
  await supabase.from('activity_log').insert({
    action: 'hmis_ot_consumption',
    entity_type: 'stock',
    details: {
      centre_code, patient_name, patient_uhid,
      procedure, ot_location, surgeon,
      date: consumption_date,
      items_deducted: deducted.length,
      items_failed: failed.length,
    },
  })

  return bridgeSuccess('ot_consumption', {
    deducted,
    failed,
    summary: `${deducted.length} items deducted, ${failed.length} failed`,
    patient: patient_name,
    procedure,
  })
})
