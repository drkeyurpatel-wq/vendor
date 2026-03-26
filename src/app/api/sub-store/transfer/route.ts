import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { withApiErrorHandler } from '@/lib/api-error-handler'
import { format } from 'date-fns'

// ============================================================
// H1 VPMS — Sub-Store Transfer API
// POST: create transfer request
// PUT: dispatch or receive transfer
// ============================================================

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rl = await rateLimit(request, 20, 60000)
  if (!rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user } = await requireApiAuth()
  const body = await request.json()
  const { from_sub_store_id, to_sub_store_id, items, notes } = body

  if (!from_sub_store_id || !to_sub_store_id) {
    return NextResponse.json({ error: 'Both from and to sub-stores are required' }, { status: 400 })
  }
  if (from_sub_store_id === to_sub_store_id) {
    return NextResponse.json({ error: 'Cannot transfer to the same sub-store' }, { status: 400 })
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
  }

  // Validate sub-stores exist and get centre info
  const { data: fromStore } = await supabase
    .from('sub_stores').select('id, code, name, centre_id').eq('id', from_sub_store_id).single()
  const { data: toStore } = await supabase
    .from('sub_stores').select('id, code, name, centre_id').eq('id', to_sub_store_id).single()

  if (!fromStore || !toStore) {
    return NextResponse.json({ error: 'Invalid sub-store(s)' }, { status: 400 })
  }

  // Validate stock availability for each item
  const stockErrors: string[] = []
  for (const item of items) {
    if (!item.item_id || !item.qty || item.qty <= 0) {
      stockErrors.push(`Invalid item or quantity`)
      continue
    }

    const { data: stock } = await supabase
      .from('item_substore_stock')
      .select('current_stock')
      .eq('item_id', item.item_id)
      .eq('sub_store_id', from_sub_store_id)
      .single()

    if (!stock || stock.current_stock < item.qty) {
      stockErrors.push(`${item.item_name || item.item_id}: available ${stock?.current_stock || 0}, requested ${item.qty}`)
    }
  }

  if (stockErrors.length > 0) {
    return NextResponse.json({
      error: 'Insufficient stock',
      details: stockErrors,
    }, { status: 400 })
  }

  // Generate transfer number
  const yyMM = format(new Date(), 'yyMM')
  const { count } = await supabase.from('stock_transfers').select('*', { count: 'exact', head: true })
  const transferNumber = `H1-ST-${yyMM}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Calculate total value
  const totalValue = items.reduce((s: number, i: any) => s + (i.qty * (i.rate || 0)), 0)

  // Create transfer record
  const { data: transfer, error: transferErr } = await supabase.from('stock_transfers').insert({
    transfer_number: transferNumber,
    from_centre_id: fromStore.centre_id,
    to_centre_id: toStore.centre_id,
    from_sub_store_id: fromStore.id,
    to_sub_store_id: toStore.id,
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'requested',
    item_count: items.length,
    total_value: Math.round(totalValue * 100) / 100,
    notes: notes?.trim() || null,
    created_by: user.id,
  }).select().single()

  if (transferErr || !transfer) {
    return NextResponse.json({ error: 'Failed to create transfer: ' + transferErr?.message }, { status: 500 })
  }

  // Insert transfer line items
  const transferItems = items.map((item: any) => ({
    transfer_id: transfer.id,
    item_id: item.item_id,
    requested_qty: item.qty,
    dispatched_qty: 0,
    received_qty: 0,
    rate: item.rate || 0,
    unit: item.unit || 'Nos',
    batch_number: item.batch_number || null,
    expiry_date: item.expiry_date || null,
    notes: item.notes || null,
  }))

  const { error: itemsErr } = await supabase.from('stock_transfer_items').insert(transferItems)
  if (itemsErr) {
    return NextResponse.json({ error: 'Failed to add transfer items: ' + itemsErr.message }, { status: 500 })
  }

  // Log activity
  try {
    await supabase.from('activity_log').insert({
      user_id: user.id, action: 'transfer_requested', entity_type: 'stock_transfer', entity_id: transfer.id,
      details: { transfer_number: transferNumber, from: fromStore.name, to: toStore.name, items: items.length },
    })
  } catch { /* non-critical */ }

  return NextResponse.json({
    success: true,
    transfer: { id: transfer.id, transfer_number: transferNumber },
    message: `Transfer ${transferNumber} created: ${fromStore.name} → ${toStore.name} (${items.length} items)`,
  })
})

export const PUT = withApiErrorHandler(async (request: NextRequest) => {
  const rl = await rateLimit(request, 20, 60000)
  if (!rl.success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { supabase, user } = await requireApiAuth()
  const body = await request.json()
  const { transfer_id, action, items } = body

  if (!transfer_id || !action) {
    return NextResponse.json({ error: 'transfer_id and action required' }, { status: 400 })
  }

  // Get transfer with items
  const { data: transfer } = await supabase
    .from('stock_transfers')
    .select('*, from_sub:sub_stores!stock_transfers_from_sub_store_id_fkey(id, code, name, centre_id), to_sub:sub_stores!stock_transfers_to_sub_store_id_fkey(id, code, name, centre_id)')
    .eq('id', transfer_id)
    .single()

  if (!transfer) {
    return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  // ── DISPATCH: sender confirms items are sent ──
  if (action === 'dispatch') {
    if (transfer.status !== 'requested') {
      return NextResponse.json({ error: `Cannot dispatch: status is ${transfer.status}` }, { status: 400 })
    }

    // Update transfer items with dispatched quantities
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await supabase.from('stock_transfer_items')
          .update({ dispatched_qty: item.dispatched_qty })
          .eq('id', item.id)
      }
    } else {
      // Default: dispatched = requested for all items
      const { data: tItems } = await supabase.from('stock_transfer_items')
        .select('id, requested_qty').eq('transfer_id', transfer_id)
      for (const ti of (tItems || [])) {
        await supabase.from('stock_transfer_items')
          .update({ dispatched_qty: ti.requested_qty })
          .eq('id', ti.id)
      }
    }

    // Deduct stock from sender sub-store
    const { data: tItems } = await supabase.from('stock_transfer_items')
      .select('item_id, dispatched_qty').eq('transfer_id', transfer_id)

    for (const ti of (tItems || [])) {
      if (ti.dispatched_qty <= 0) continue

      const { data: stock } = await supabase.from('item_substore_stock')
        .select('id, current_stock')
        .eq('item_id', ti.item_id)
        .eq('sub_store_id', transfer.from_sub_store_id)
        .single()

      if (stock) {
        await supabase.from('item_substore_stock').update({
          current_stock: Math.max(0, stock.current_stock - ti.dispatched_qty),
          updated_at: now,
        }).eq('id', stock.id)
      }

      // Also deduct from centre-level stock
      const { data: centreStock } = await supabase.from('item_centre_stock')
        .select('id, current_stock')
        .eq('item_id', ti.item_id)
        .eq('centre_id', transfer.from_centre_id)
        .single()

      // Only deduct from centre stock if transferring between centres
      // Intra-centre transfers don't change centre totals
      if (transfer.from_centre_id !== transfer.to_centre_id && centreStock) {
        await supabase.from('item_centre_stock').update({
          current_stock: Math.max(0, centreStock.current_stock - ti.dispatched_qty),
          updated_at: now,
        }).eq('id', centreStock.id)
      }

      // Stock ledger entry — outgoing
      await supabase.from('stock_ledger').insert({
        item_id: ti.item_id,
        centre_id: transfer.from_centre_id,
        sub_store_id: transfer.from_sub_store_id,
        transaction_type: 'transfer_out',
        quantity: -ti.dispatched_qty,
        balance_after: stock ? Math.max(0, stock.current_stock - ti.dispatched_qty) : 0,
        reference_id: transfer.id,
        reference_number: transfer.transfer_number,
        notes: `Transfer to ${transfer.to_sub?.name || 'sub-store'}`,
        created_by: user.id,
      })
    }

    await supabase.from('stock_transfers').update({
      status: 'dispatched', updated_at: now,
    }).eq('id', transfer_id)

    return NextResponse.json({ success: true, message: 'Transfer dispatched — awaiting receiver confirmation' })
  }

  // ── RECEIVE: receiver confirms items received ──
  if (action === 'receive') {
    if (transfer.status !== 'dispatched') {
      return NextResponse.json({ error: `Cannot receive: status is ${transfer.status}` }, { status: 400 })
    }

    // Update received quantities
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await supabase.from('stock_transfer_items')
          .update({ received_qty: item.received_qty })
          .eq('id', item.id)
      }
    } else {
      // Default: received = dispatched
      const { data: tItems } = await supabase.from('stock_transfer_items')
        .select('id, dispatched_qty').eq('transfer_id', transfer_id)
      for (const ti of (tItems || [])) {
        await supabase.from('stock_transfer_items')
          .update({ received_qty: ti.dispatched_qty })
          .eq('id', ti.id)
      }
    }

    // Add stock to receiver sub-store
    const { data: tItems } = await supabase.from('stock_transfer_items')
      .select('item_id, received_qty, rate').eq('transfer_id', transfer_id)

    for (const ti of (tItems || [])) {
      if (ti.received_qty <= 0) continue

      const { data: existing } = await supabase.from('item_substore_stock')
        .select('id, current_stock')
        .eq('item_id', ti.item_id)
        .eq('sub_store_id', transfer.to_sub_store_id)
        .single()

      if (existing) {
        await supabase.from('item_substore_stock').update({
          current_stock: existing.current_stock + ti.received_qty,
          last_transfer_date: now.split('T')[0],
          updated_at: now,
        }).eq('id', existing.id)
      } else {
        await supabase.from('item_substore_stock').insert({
          item_id: ti.item_id,
          sub_store_id: transfer.to_sub_store_id,
          current_stock: ti.received_qty,
          last_transfer_date: now.split('T')[0],
        })
      }

      // If inter-centre, add to receiving centre stock
      if (transfer.from_centre_id !== transfer.to_centre_id) {
        const { data: centreStock } = await supabase.from('item_centre_stock')
          .select('id, current_stock')
          .eq('item_id', ti.item_id)
          .eq('centre_id', transfer.to_centre_id)
          .single()

        if (centreStock) {
          await supabase.from('item_centre_stock').update({
            current_stock: centreStock.current_stock + ti.received_qty,
            updated_at: now,
          }).eq('id', centreStock.id)
        } else {
          await supabase.from('item_centre_stock').insert({
            item_id: ti.item_id,
            centre_id: transfer.to_centre_id,
            current_stock: ti.received_qty,
            last_grn_rate: ti.rate || 0,
          })
        }
      }

      // Stock ledger entry — incoming
      const newStock = existing ? existing.current_stock + ti.received_qty : ti.received_qty
      await supabase.from('stock_ledger').insert({
        item_id: ti.item_id,
        centre_id: transfer.to_centre_id,
        sub_store_id: transfer.to_sub_store_id,
        transaction_type: 'transfer_in',
        quantity: ti.received_qty,
        balance_after: newStock,
        reference_id: transfer.id,
        reference_number: transfer.transfer_number,
        notes: `Transfer from ${transfer.from_sub?.name || 'sub-store'}`,
        created_by: user.id,
      })
    }

    await supabase.from('stock_transfers').update({
      status: 'received',
      received_by: user.id,
      received_at: now,
      updated_at: now,
    }).eq('id', transfer_id)

    return NextResponse.json({ success: true, message: 'Transfer received — stock updated' })
  }

  // ── CANCEL ──
  if (action === 'cancel') {
    if (transfer.status === 'received') {
      return NextResponse.json({ error: 'Cannot cancel a received transfer' }, { status: 400 })
    }

    // If already dispatched, reverse the stock deduction
    if (transfer.status === 'dispatched') {
      const { data: tItems } = await supabase.from('stock_transfer_items')
        .select('item_id, dispatched_qty').eq('transfer_id', transfer_id)

      for (const ti of (tItems || [])) {
        if (ti.dispatched_qty <= 0) continue

        const { data: stock } = await supabase.from('item_substore_stock')
          .select('id, current_stock')
          .eq('item_id', ti.item_id)
          .eq('sub_store_id', transfer.from_sub_store_id)
          .single()

        if (stock) {
          await supabase.from('item_substore_stock').update({
            current_stock: stock.current_stock + ti.dispatched_qty,
            updated_at: now,
          }).eq('id', stock.id)
        }

        // Reverse stock ledger
        await supabase.from('stock_ledger').insert({
          item_id: ti.item_id,
          centre_id: transfer.from_centre_id,
          sub_store_id: transfer.from_sub_store_id,
          transaction_type: 'transfer_cancelled',
          quantity: ti.dispatched_qty,
          balance_after: stock ? stock.current_stock + ti.dispatched_qty : ti.dispatched_qty,
          reference_id: transfer.id,
          reference_number: transfer.transfer_number,
          notes: `Transfer cancelled — stock restored`,
          created_by: user.id,
        })
      }
    }

    await supabase.from('stock_transfers').update({
      status: 'cancelled', updated_at: now,
    }).eq('id', transfer_id)

    return NextResponse.json({ success: true, message: 'Transfer cancelled' + (transfer.status === 'dispatched' ? ' — stock restored to sender' : '') })
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
})
