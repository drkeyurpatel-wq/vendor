import { requireAuth } from '@/lib/auth'
import { canApprovePO } from '@/types/database'
import type { UserRole } from '@/types/database'
import ApprovalsClient from './ApprovalsClient'

export const dynamic = 'force-dynamic'

/**
 * Approvals inbox — "POs waiting on me".
 *
 * A PO appears here only when ALL of the following hold:
 *  - status is 'pending_approval'
 *  - its po_approvals row at the current level is still 'pending'
 *  - that row's approver_role matches the signed-in user's role
 *  - the amount is within the user's authority (canApprovePO)
 *
 * The last check is belt-and-braces: /api/po/approve enforces it server-side
 * and returns 403 otherwise. Filtering here keeps the list honest so nobody
 * sees a row they cannot action.
 */
export default async function ApprovalsPage() {
  const { supabase, role, centreId, isGroupLevel } = await requireAuth()

  let query = supabase
    .from('purchase_orders')
    .select(
      'id, po_number, po_date, total_amount, priority, current_approval_level, ' +
      'vendor:vendors(legal_name), centre:centres(code, name), ' +
      'approvals:po_approvals(id, approval_level, approver_role, status)'
    )
    .eq('status', 'pending_approval')
    .is('deleted_at', null)
    .order('po_date', { ascending: true })

  // Unit-level roles only see their own centre.
  if (!isGroupLevel && centreId) query = query.eq('centre_id', centreId)

  const { data } = await query.limit(200)

  type Row = {
    id: string
    total_amount: number
    current_approval_level: number | null
    approvals: { approval_level: number; approver_role: string; status: string }[] | null
  }
  const rows = (data ?? []) as unknown as Row[]

  const pending = rows.filter(po => {
    const level = po.current_approval_level || 1
    const row = po.approvals?.find(a => a.approval_level === level && a.status === 'pending')
    if (!row) return false
    if (row.approver_role !== role) return false
    return canApprovePO(role as UserRole, po.total_amount)
  })

  return <ApprovalsClient pos={pending as never[]} role={role as UserRole} />
}
