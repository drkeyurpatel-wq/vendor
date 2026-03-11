import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { canApprovePO } from '@/types/database'
import type { UserRole } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const body = await request.json()
  const { po_id, action, comments } = body

  if (!po_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Get PO
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id, status, total_amount')
    .eq('id', po_id)
    .single()

  if (!po) {
    return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  }

  if (po.status !== 'pending_approval') {
    return NextResponse.json({ error: 'PO is not pending approval' }, { status: 400 })
  }

  if (!canApprovePO(profile.role as UserRole, po.total_amount)) {
    return NextResponse.json({ error: 'Insufficient approval authority' }, { status: 403 })
  }

  if (action === 'reject' && !comments?.trim()) {
    return NextResponse.json({ error: 'Comments required for rejection' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Update approval record
  await supabase.from('po_approvals')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_by: user.id,
      approved_at: now,
      comments: comments?.trim() || null,
    })
    .eq('po_id', po_id)
    .eq('status', 'pending')

  // Update PO status
  const newStatus = action === 'approve' ? 'approved' : 'cancelled'
  await supabase.from('purchase_orders')
    .update({ status: newStatus, updated_at: now })
    .eq('id', po_id)

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: action === 'approve' ? 'po_approved' : 'po_rejected',
    entity_type: 'purchase_order',
    entity_id: po_id,
    details: { comments: comments?.trim() || null },
  })

  return NextResponse.json({ success: true, status: newStatus })
}
