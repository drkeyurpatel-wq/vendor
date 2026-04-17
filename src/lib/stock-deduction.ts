import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Deduct stock for a single consumption line.
 *
 * 1. Reads current stock from item_centre_stock
 * 2. Updates current_stock (floors at 0)
 * 3. Writes a stock_ledger entry for audit trail
 *
 * Returns { success, newStock, error? }
 */
export async function deductStock(
  supabase: SupabaseClient,
  params: {
    itemId: string
    centreId: string
    quantity: number
    userId: string
    notes?: string
    referenceNumber?: string
  }
): Promise<{ success: boolean; newStock?: number; error?: string }> {
  const { itemId, centreId, quantity, userId, notes, referenceNumber } = params

  if (quantity <= 0) {
    return { success: false, error: 'Quantity must be positive' }
  }

  // 1. Get current stock
  const { data: stock, error: stockErr } = await supabase
    .from('item_centre_stock')
    .select('id, current_stock, reorder_level')
    .eq('item_id', itemId)
    .eq('centre_id', centreId)
    .single()

  if (stockErr || !stock) {
    return { success: false, error: `No stock record for item at this centre` }
  }

  const newStock = Math.max(0, stock.current_stock - quantity)

  // 2. Update stock balance
  const { error: updateErr } = await supabase
    .from('item_centre_stock')
    .update({
      current_stock: newStock,
      last_consumption_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', stock.id)

  if (updateErr) {
    return { success: false, error: `Stock update failed: ${updateErr.message}` }
  }

  // 3. Write stock ledger entry
  const { error: ledgerErr } = await supabase.from('stock_ledger').insert({
    centre_id: centreId,
    item_id: itemId,
    transaction_type: 'consumption',
    quantity: -quantity,
    balance_after: newStock,
    reference_number: referenceNumber || null,
    notes: notes || 'Manual consumption entry',
    created_by: userId,
  })

  if (ledgerErr) {
    // Stock was deducted but ledger failed — log but don't rollback
    console.error(`[stock-deduction] Ledger write failed for item ${itemId}:`, ledgerErr.message)
  }

  return { success: true, newStock }
}

/**
 * Batch deduct stock for multiple consumption lines.
 * Returns per-line results + summary counts.
 */
export async function batchDeductStock(
  supabase: SupabaseClient,
  lines: Array<{
    itemId: string
    centreId: string
    quantity: number
    notes?: string
    referenceNumber?: string
  }>,
  userId: string
): Promise<{
  processed: number
  failed: number
  errors: Array<{ index: number; itemId: string; error: string }>
}> {
  let processed = 0
  let failed = 0
  const errors: Array<{ index: number; itemId: string; error: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const result = await deductStock(supabase, {
      itemId: line.itemId,
      centreId: line.centreId,
      quantity: line.quantity,
      userId,
      notes: line.notes,
      referenceNumber: line.referenceNumber,
    })

    if (result.success) {
      processed++
    } else {
      failed++
      errors.push({ index: i, itemId: line.itemId, error: result.error || 'Unknown error' })
    }
  }

  return { processed, failed, errors }
}
