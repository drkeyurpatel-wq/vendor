import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBridge, bridgeSuccess, bridgeError } from '@/lib/bridge-auth'
import { format } from 'date-fns'
import { withApiErrorHandler } from '@/lib/api-error-handler'

/**
 * FLOW B: Pharmacy/Ward Indent → VPMS Purchase Indent
 *
 * HMIS sends this when a nurse or pharmacist creates an indent for items
 * that are out of stock or below reorder level.
 *
 * HMIS payload:
 * {
 *   centre_code: "SHI",
 *   department: "Pharmacy",
 *   requested_by: "Nurse Priya Sharma",
 *   priority: "urgent",              // routine | urgent | emergency
 *   reason: "ICU patient requires",
 *   items: [
 *     { item_code: "H1I-00001", qty: 100, notes: "Running low" },
 *     { item_code: "H1I-00015", qty: 50 }
 *   ]
 * }
 */
export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const authErr = validateBridge(request)
  if (authErr) return authErr

  const body = await request.json()
  const { centre_code, department, requested_by, priority, reason, items } = body

  if (!centre_code || !items?.length) {
    return bridgeError('pharmacy_indent', 'centre_code and items[] required')
  }

  const supabase = await createClient()

  // Find centre
  const { data: centre } = await supabase.from('centres').select('id').eq('code', centre_code).single()
  if (!centre) return bridgeError('pharmacy_indent', `Centre ${centre_code} not found`)

  // Resolve item codes to IDs
  const itemCodes = items.map((i: any) => i.item_code)
  const { data: vpmsItems } = await supabase.from('items')
    .select('id, item_code, generic_name, unit')
    .in('item_code', itemCodes)

  const itemMap = new Map((vpmsItems || []).map(i => [i.item_code, i]))
  const notFound = itemCodes.filter((c: string) => !itemMap.has(c))
  if (notFound.length === itemCodes.length) {
    return bridgeError('pharmacy_indent', `None of the items found in VPMS: ${notFound.join(', ')}`)
  }

  // Create purchase indent
  const now = new Date()
  const yyMM = format(now, 'yyMM')
  const { count } = await supabase.from('purchase_indents').select('*', { count: 'exact', head: true })
  const indentNum = `H1-HI-${yyMM}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data: indent, error: indErr } = await supabase.from('purchase_indents').insert({
    indent_number: indentNum,
    centre_id: centre.id,
    status: priority === 'emergency' ? 'approved' : 'pending_approval',
    priority: priority || 'routine',
    department: department || 'Pharmacy',
    notes: `HMIS indent from ${requested_by || department || 'ward'}${reason ? '. Reason: ' + reason : ''}`,
    source: 'hmis_bridge',
  }).select().single()

  if (indErr || !indent) return bridgeError('pharmacy_indent', 'Indent creation failed: ' + indErr?.message, 500)

  // Add line items
  const indentItems = items
    .filter((i: any) => itemMap.has(i.item_code))
    .map((i: any) => {
      const vpmsItem = itemMap.get(i.item_code)!
      return {
        indent_id: indent.id,
        item_id: vpmsItem.id,
        requested_qty: i.qty || 1,
        approved_qty: priority === 'emergency' ? (i.qty || 1) : null,
        notes: i.notes || null,
      }
    })

  if (indentItems.length > 0) {
    await supabase.from('purchase_indent_items').insert(indentItems)
  }

  return bridgeSuccess('pharmacy_indent', {
    indent_id: indent.id,
    indent_number: indentNum,
    status: indent.status,
    items_added: indentItems.length,
    items_not_found: notFound,
    message: `Indent ${indentNum} created with ${indentItems.length} items${notFound.length ? `. Not found: ${notFound.join(', ')}` : ''}`,
  })
})
