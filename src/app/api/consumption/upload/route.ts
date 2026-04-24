import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuthWithProfile } from '@/lib/auth'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { batchDeductStock } from '@/lib/stock-deduction'
import { autoReorderForItems } from '@/lib/auto-reorder'

// 380+ items × stock deduction + ledger + reorder = needs more than 10s default
export const maxDuration = 60

/**
 * POST /api/consumption/upload
 *
 * Server-side handler for manual + CSV consumption uploads.
 * For each line:
 *   1. Inserts into consumption_records (audit/reporting)
 *   2. Deducts from item_centre_stock (stock balance)
 *   3. Writes stock_ledger entry (audit trail)
 *
 * Body: {
 *   centre_id: string
 *   consumption_date: string (YYYY-MM-DD)
 *   upload_batch_id: string
 *   source: 'manual' | 'csv_upload'
 *   records: Array<{
 *     item_id: string
 *     item_code?: string
 *     quantity: number
 *     unit?: string
 *     rate?: number
 *     department?: string
 *     ward?: string
 *     patient_name?: string
 *     ip_number?: string
 *     batch_number?: string
 *     notes?: string
 *   }>
 * }
 */
export const POST = withApiErrorHandler(async (req: NextRequest) => {
  const { supabase, user, role } = await requireApiAuthWithProfile()

  if (!['group_admin', 'group_cao', 'unit_cao', 'store_staff'].includes(role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const { centre_id, consumption_date, upload_batch_id, source, records } = body

  if (!centre_id) {
    return NextResponse.json({ error: 'centre_id is required' }, { status: 400 })
  }
  if (!records || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'No records provided' }, { status: 400 })
  }

  // 1. Insert consumption_records (for reporting/audit)
  const consumptionRows = records.map((r: any) => ({
    centre_id,
    item_id: r.item_id,
    consumption_date: r.consumption_date || consumption_date,
    department: r.department || 'Pharmacy',
    ward: r.ward || null,
    quantity: r.quantity,
    unit: r.unit || 'Nos',
    rate: r.rate || null,
    total_value: r.quantity * (r.rate || 0),
    patient_name: r.patient_name || null,
    ip_number: r.ip_number || null,
    batch_number: r.batch_number || null,
    notes: r.notes || null,
    source: source || 'manual',
    uploaded_by: user.id,
    upload_batch_id: upload_batch_id || null,
  }))

  const { error: insertErr } = await supabase
    .from('consumption_records')
    .insert(consumptionRows)

  if (insertErr) {
    return NextResponse.json(
      { error: `Failed to save consumption records: ${insertErr.message}` },
      { status: 500 }
    )
  }

  // 2. Deduct stock for each line
  const stockLines = records.map((r: any) => ({
    itemId: r.item_id,
    centreId: centre_id,
    quantity: r.quantity,
    notes: [r.department, r.ward, r.notes].filter(Boolean).join(' | ') || `Consumption ${consumption_date}`,
    referenceNumber: r.ip_number || r.patient_name || upload_batch_id || null,
  }))

  const stockResult = await batchDeductStock(supabase, stockLines, user.id)

  // 3. Auto-reorder: if any items crossed below reorder level, generate draft POs
  let reorderResult = { created: 0, pos: [] as any[], skipped: 0 }
  if (stockResult.reorderTriggered.length > 0) {
    reorderResult = await autoReorderForItems(
      supabase,
      stockResult.reorderTriggered.map(r => ({
        itemId: r.itemId,
        centreId: r.centreId,
        newStock: r.newStock,
        reorderLevel: r.reorderLevel,
      })),
      user.id
    )
  }

  // 4. Log activity
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'consumption_upload',
    entity_type: 'stock',
    details: {
      centre_id,
      date: consumption_date,
      source: source || 'manual',
      batch_id: upload_batch_id,
      records_saved: records.length,
      stock_deducted: stockResult.processed,
      stock_failed: stockResult.failed,
      reorder_triggered: stockResult.reorderTriggered.length,
      auto_pos_created: reorderResult.created,
      errors: stockResult.errors.length > 0 ? stockResult.errors : undefined,
    },
  })

  return NextResponse.json({
    success: true,
    records_saved: records.length,
    stock_deducted: stockResult.processed,
    stock_failed: stockResult.failed,
    stock_errors: stockResult.errors,
    batch_id: upload_batch_id,
    reorder_triggered: stockResult.reorderTriggered.length,
    auto_pos_created: reorderResult.created,
    auto_pos: reorderResult.pos,
  })
})
