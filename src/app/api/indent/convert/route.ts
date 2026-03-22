import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { indent_id } = body

  if (!indent_id) return NextResponse.json({ error: 'indent_id required' }, { status: 400 })

  // 1. Fetch indent with items
  const { data: indent, error: indentErr } = await supabase
    .from('purchase_indents')
    .select('*, centre:centres(id, code, name, state), items:purchase_indent_items(*, item:items(id, item_code, generic_name, brand_name, unit, gst_percent, hsn_code))')
    .eq('id', indent_id)
    .single()

  if (indentErr || !indent) {
    return NextResponse.json({ error: 'Indent not found' }, { status: 404 })
  }

  if (indent.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved indents can be converted to PO' }, { status: 400 })
  }

  // 2. For each item, find L1 vendor from active rate contracts or vendor_items
  const itemVendorMap: Record<string, { vendor_id: string; rate: number; vendor_name: string }[]> = {}

  for (const indentItem of (indent.items || [])) {
    const itemId = indentItem.item_id

    // Check active rate contracts first
    const { data: contractItems } = await supabase
      .from('rate_contract_items')
      .select('rate, l_rank, contract:rate_contracts(vendor_id, status, valid_to, vendor:vendors(id, legal_name))')
      .eq('item_id', itemId)
      .order('l_rank', { ascending: true })

    const activeContracts = (contractItems || []).filter((ci: any) =>
      ci.contract?.status === 'active' &&
      new Date(ci.contract.valid_to) >= new Date()
    )

    if (activeContracts.length > 0) {
      const vendorGroups: Record<string, { vendor_id: string; rate: number; vendor_name: string }> = {}
      for (const ac of activeContracts) {
        const vid = ac.contract?.vendor?.id
        if (vid && !vendorGroups[vid]) {
          vendorGroups[vid] = {
            vendor_id: vid,
            rate: ac.rate,
            vendor_name: ac.contract?.vendor?.legal_name || 'Unknown',
          }
        }
      }
      itemVendorMap[itemId] = Object.values(vendorGroups)
    } else {
      // Fallback: vendor_items with L1 rank
      const { data: vendorItems } = await supabase
        .from('vendor_items')
        .select('vendor_id, l_rank, last_quoted_rate, vendor:vendors(id, legal_name)')
        .eq('item_id', itemId)
        .order('l_rank', { ascending: true, nullsFirst: false })
        .limit(3)

      if (vendorItems?.length) {
        itemVendorMap[itemId] = vendorItems.map((vi: any) => ({
          vendor_id: vi.vendor_id,
          rate: vi.last_quoted_rate || 0,
          vendor_name: vi.vendor?.legal_name || 'Unknown',
        }))
      }
    }
  }

  // 3. Group items by L1 vendor (if all items share a vendor, one PO; otherwise split)
  // For simplicity: find if there's a single vendor that covers all items at L1
  const allItemIds = (indent.items || []).map((i: any) => i.item_id)
  
  // Try to find a common L1 vendor
  let commonVendor: string | null = null
  if (allItemIds.length > 0 && itemVendorMap[allItemIds[0]]?.length > 0) {
    for (const candidate of itemVendorMap[allItemIds[0]]) {
      const coversAll = allItemIds.every((iid: string) =>
        itemVendorMap[iid]?.some(v => v.vendor_id === candidate.vendor_id)
      )
      if (coversAll) {
        commonVendor = candidate.vendor_id
        break
      }
    }
  }

  // 4. Build PO pre-fill data (redirect to PO creation form with query params)
  const prefillItems = (indent.items || []).map((indentItem: any) => {
    const vendorRate = commonVendor
      ? itemVendorMap[indentItem.item_id]?.find(v => v.vendor_id === commonVendor)?.rate || indentItem.last_purchase_rate || 0
      : indentItem.last_purchase_rate || 0

    return {
      item_id: indentItem.item_id,
      item_code: indentItem.item?.item_code,
      generic_name: indentItem.item?.generic_name,
      brand_name: indentItem.item?.brand_name,
      unit: indentItem.item?.unit || indentItem.unit,
      qty: indentItem.requested_qty,
      rate: vendorRate,
      gst_percent: indentItem.item?.gst_percent || 12,
      hsn_code: indentItem.item?.hsn_code,
    }
  })

  // 5. Mark indent as converted
  await supabase
    .from('purchase_indents')
    .update({ status: 'converted_to_po' })
    .eq('id', indent_id)

  return NextResponse.json({
    success: true,
    centre_id: indent.centre_id,
    centre_code: indent.centre?.code,
    vendor_id: commonVendor,
    vendor_name: commonVendor ? itemVendorMap[allItemIds[0]]?.find(v => v.vendor_id === commonVendor)?.vendor_name : null,
    indent_id: indent.id,
    indent_number: indent.indent_number,
    items: prefillItems,
    priority: indent.priority,
    notes: `Converted from Indent ${indent.indent_number}`,
    message: commonVendor
      ? `Ready to create PO with L1 vendor`
      : `No common L1 vendor found — select vendor manually. ${Object.keys(itemVendorMap).length} items have vendor mappings.`,
  })
}
