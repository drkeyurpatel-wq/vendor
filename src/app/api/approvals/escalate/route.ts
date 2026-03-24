import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// H1 VPMS — Approval SLA Escalation
// Checks pending approvals that exceeded SLA deadline
// Escalates to next level approver + sends notification
// Called from daily cron
// ============================================================

const ESCALATION_ROLES: Record<string, string> = {
  unit_purchase_manager: 'unit_cao',
  unit_cao: 'group_cao',
  group_cao: 'group_admin',
  group_admin: 'group_admin', // MD is final
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const now = new Date()

  // Find POs in pending_approval that have been waiting > 24 hours at current level
  const { data: pendingPOs } = await supabase
    .from('purchase_orders')
    .select('id, po_number, total_amount, current_approval_level, status, created_at, updated_at, centre_id')
    .eq('status', 'pending_approval')

  if (!pendingPOs?.length) return NextResponse.json({ escalated: 0, message: 'No pending POs' })

  let escalated = 0

  for (const po of pendingPOs) {
    const lastUpdate = new Date(po.updated_at || po.created_at)
    const hoursWaiting = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)

    if (hoursWaiting < 24) continue // Still within SLA

    // Get latest approval record
    const { data: latestApproval } = await supabase
      .from('po_approvals')
      .select('approver_role, approval_level')
      .eq('po_id', po.id)
      .order('approval_level', { ascending: false })
      .limit(1).single()

    const currentRole = latestApproval?.approver_role || 'unit_purchase_manager'
    const escalateToRole = ESCALATION_ROLES[currentRole] || 'group_admin'

    // Find an approver with the escalated role
    const { data: escalateUser } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('role', escalateToRole)
      .eq('is_active', true)
      .limit(1).single()

    if (!escalateUser) continue

    // Create escalation notification
    await supabase.from('notifications').insert({
      action: 'approval_escalated',
      entity_type: 'purchase_order',
      entity_id: po.id,
      details: {
        po_number: po.po_number,
        amount: po.total_amount,
        hours_waiting: Math.round(hoursWaiting),
        escalated_from: currentRole,
        escalated_to: escalateToRole,
      },
      is_read: false,
    })

    // Update PO to flag escalation
    await supabase.from('purchase_orders').update({
      notes: `[AUTO-ESCALATED] Pending ${Math.round(hoursWaiting)}h — escalated to ${escalateToRole}`,
      updated_at: now.toISOString(),
    }).eq('id', po.id)

    escalated++
  }

  return NextResponse.json({ escalated, checked: pendingPOs.length })
}
