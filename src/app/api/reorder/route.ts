import { createClient } from '@/lib/supabase/server'
import { requireApiAuthWithProfile } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// H1 VPMS — Auto-Reorder Engine
// GET  /api/reorder?mode=check  → dry run, returns what would be ordered
// POST /api/reorder?mode=generate → creates draft POs
// Can be triggered by Vercel Cron (vercel.json) or manually
// ============================================================

interface ReorderItem {
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  centre_id: string
  centre_code: string
  current_stock: number
  reorder_level: number
  max_level: number
  reorder_qty: number
  l1_vendor_id: string | null
  l1_vendor_code: string | null
  l1_vendor_name: string | null
  l1_rate: number | null
}

interface PODraft {
  vendor_id: string
  vendor_code: string
  vendor_name: string
  centre_id: string
  centre_code: string
  items: ReorderItem[]
  estimated_total: number
}

async function scanReorderNeeds(supabase: any): Promise<ReorderItem[]> {
  // Fetch all items below reorder level
  const { data: stockRows, error } = await supabase
    .from('item_centre_stock')
    .select('item_id, centre_id, current_stock, reorder_level, max_level, item:items(item_code, generic_name, unit, is_active), centre:centres(code)')
    .gt('reorder_level', 0)
    .filter('current_stock', 'lte', 'reorder_level') // Postgres: lte means <=, but we need raw filter

  if (error) throw new Error(`Stock scan failed: ${error.message}`)

  // Filter in-app: current_stock <= reorder_level AND item is active
  const belowReorder = (stockRows || []).filter((row: any) =>
    row.current_stock <= row.reorder_level && row.item?.is_active !== false
  )

  if (belowReorder.length === 0) return []

  // Fetch L1 vendor mapping for all items
  const itemIds = Array.from(new Set(belowReorder.map((r: any) => r.item_id)))
  const { data: vendorItems } = await supabase
    .from('vendor_items')
    .select('item_id, vendor_id, rate, vendor:vendors(vendor_code, legal_name, status)')
    .in('item_id', itemIds)
    .eq('l_rank', 1)

  const vendorMap = new Map<string, any>()
  ;(vendorItems || []).forEach((vi: any) => {
    if (vi.vendor?.status === 'active') vendorMap.set(vi.item_id, vi)
  })

  // Check for existing open POs to avoid duplicates
  const { data: openPOItems } = await supabase
    .from('purchase_order_items')
    .select('item_id, po:purchase_orders!inner(centre_id, status)')
    .in('item_id', itemIds)
    .in('po.status', ['draft', 'pending_approval', 'approved', 'sent_to_vendor'])

  const openPOSet = new Set(
    (openPOItems || []).map((pi: any) => `${pi.item_id}_${pi.po?.centre_id}`)
  )

  return belowReorder
    .filter((row: any) => !openPOSet.has(`${row.item_id}_${row.centre_id}`))
    .map((row: any) => {
      const vi = vendorMap.get(row.item_id)
      const maxLevel = row.max_level || row.reorder_level * 2
      const reorderQty = Math.max(1, Math.ceil(maxLevel - row.current_stock))

      return {
        item_id: row.item_id,
        item_code: row.item?.item_code || '',
        generic_name: row.item?.generic_name || '',
        unit: row.item?.unit || 'nos',
        centre_id: row.centre_id,
        centre_code: row.centre?.code || '',
        current_stock: row.current_stock,
        reorder_level: row.reorder_level,
        max_level: maxLevel,
        reorder_qty: reorderQty,
        l1_vendor_id: vi?.vendor_id || null,
        l1_vendor_code: vi?.vendor?.vendor_code || null,
        l1_vendor_name: vi?.vendor?.legal_name || null,
        l1_rate: vi?.rate || null,
      }
    })
}

function groupIntoPOs(items: ReorderItem[]): PODraft[] {
  // Group by vendor_id + centre_id
  const map = new Map<string, PODraft>()

  items.forEach(item => {
    if (!item.l1_vendor_id) return // Skip items without L1 vendor
    const key = `${item.l1_vendor_id}_${item.centre_id}`
    if (!map.has(key)) {
      map.set(key, {
        vendor_id: item.l1_vendor_id,
        vendor_code: item.l1_vendor_code || '',
        vendor_name: item.l1_vendor_name || '',
        centre_id: item.centre_id,
        centre_code: item.centre_code,
        items: [],
        estimated_total: 0,
      })
    }
    const draft = map.get(key)!
    draft.items.push(item)
    draft.estimated_total += (item.l1_rate || 0) * item.reorder_qty
  })

  return Array.from(map.values()).sort((a, b) => b.estimated_total - a.estimated_total)
}

async function generatePONumber(supabase: any, centreCode: string): Promise<string> {
  const now = new Date()
  const prefix = `H1-${centreCode}-PO-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}-AR`
  
  const { data } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .like('po_number', `${prefix}%`)
    .order('po_number', { ascending: false })
    .limit(1)

  const lastNum = data?.[0]?.po_number
  const seq = lastNum ? parseInt(lastNum.slice(-3)) + 1 : 1
  return `${prefix}${String(seq).padStart(3, '0')}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Auth check — allow cron (no auth) or authenticated users
  const { data: { user } } = await supabase.auth.getUser()
  const isCron = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  
  if (!user && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await scanReorderNeeds(supabase)
    const drafts = groupIntoPOs(items)
    const unmapped = items.filter(i => !i.l1_vendor_id)

    return NextResponse.json({
      mode: 'check',
      summary: {
        items_below_reorder: items.length,
        items_with_l1_vendor: items.length - unmapped.length,
        items_without_vendor: unmapped.length,
        draft_pos: drafts.length,
        estimated_total: drafts.reduce((s, d) => s + d.estimated_total, 0),
      },
      drafts,
      unmapped_items: unmapped.map(i => ({ item_code: i.item_code, generic_name: i.generic_name, centre: i.centre_code })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const isCron = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  if (!user && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Role check for manual trigger
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles').select('role')
      .eq('id', user.id).single()
    if (!profile || !['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
  }

  try {
    const items = await scanReorderNeeds(supabase)
    const drafts = groupIntoPOs(items)

    if (drafts.length === 0) {
      return NextResponse.json({ message: 'No reorder needed', created: 0 })
    }

    const createdPOs: { po_number: string; vendor: string; centre: string; items: number; total: number }[] = []

    for (const draft of drafts) {
      const poNumber = await generatePONumber(supabase, draft.centre_code)
      const today = new Date().toISOString().split('T')[0]

      // Create PO
      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          po_date: today,
          vendor_id: draft.vendor_id,
          centre_id: draft.centre_id,
          status: 'draft',
          priority: 'normal',
          supply_type: 'intra_state',
          subtotal: draft.estimated_total,
          total_amount: draft.estimated_total,
          notes: `Auto-generated reorder PO — ${draft.items.length} items below reorder level`,
          created_by: user?.id || null,
        })
        .select('id')
        .single()

      if (poError || !newPO) continue

      // Create PO items
      const poItems = draft.items.map((item, idx) => ({
        purchase_order_id: newPO.id,
        item_id: item.item_id,
        quantity: item.reorder_qty,
        rate: item.l1_rate || 0,
        total_amount: (item.l1_rate || 0) * item.reorder_qty,
        serial_no: idx + 1,
      }))

      await supabase.from('purchase_order_items').insert(poItems)

      // Audit log
      try {
        await supabase.from('activity_log').insert({
          entity_type: 'purchase_order',
          entity_id: newPO.id,
          action: 'auto_reorder_created',
          user_id: user?.id || null,
          details: {
            po_number: poNumber,
            vendor: draft.vendor_code,
            centre: draft.centre_code,
            item_count: draft.items.length,
            total: draft.estimated_total,
          },
        })
      } catch {}

      createdPOs.push({
        po_number: poNumber,
        vendor: `${draft.vendor_name} (${draft.vendor_code})`,
        centre: draft.centre_code,
        items: draft.items.length,
        total: draft.estimated_total,
      })
    }

    return NextResponse.json({
      message: `Created ${createdPOs.length} draft POs`,
      created: createdPOs.length,
      pos: createdPOs,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
