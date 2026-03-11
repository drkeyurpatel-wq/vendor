import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { canApprovePO } from '@/types/database'

export const dynamic = 'force-dynamic'

interface BulkRequest {
  action: 'approve_pos' | 'update_items' | 'update_vendor_status'
  entity_type: string
  ids: string[]
  updates?: Record<string, unknown>
}

const BATCH_SIZE = 50

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, centre_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    const body: BulkRequest = await request.json()
    const { action, ids, updates } = body

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No items selected' }, { status: 400 })
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    // Process in batches
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE)

      switch (action) {
        case 'approve_pos': {
          // Validate role can approve POs
          if (!['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions to approve POs' }, { status: 403 })
          }

          // Fetch POs to validate amounts
          const { data: pos } = await supabase
            .from('purchase_orders')
            .select('id, po_number, total_amount, status')
            .in('id', batch)
            .eq('status', 'pending_approval')

          for (const po of pos || []) {
            if (!canApprovePO(profile.role, po.total_amount)) {
              errors.push(`${po.po_number}: Amount exceeds your approval limit`)
              failed++
              continue
            }

            const { error } = await supabase
              .from('purchase_orders')
              .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
              })
              .eq('id', po.id)

            if (error) {
              errors.push(`${po.po_number}: ${error.message}`)
              failed++
            } else {
              // Record approval
              await supabase.from('po_approvals').insert({
                po_id: po.id,
                approved_by: user.id,
                action: 'approved',
                comments: 'Bulk approved',
              })
              success++
            }
          }

          // Count POs that weren't pending_approval
          const pendingIds = (pos || []).map(p => p.id)
          const skippedCount = batch.filter(id => !pendingIds.includes(id)).length
          if (skippedCount > 0) {
            errors.push(`${skippedCount} PO(s) skipped — not in pending approval status`)
            failed += skippedCount
          }
          break
        }

        case 'update_items': {
          if (!['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions to update items' }, { status: 403 })
          }

          if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates specified' }, { status: 400 })
          }

          // Only allow specific fields to be bulk updated
          const allowedFields = ['category_id', 'is_active', 'department', 'item_type']
          const safeUpdates: Record<string, unknown> = {}
          for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key)) {
              safeUpdates[key] = updates[key]
            }
          }

          if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
          }

          safeUpdates.updated_at = new Date().toISOString()

          const { error, count } = await supabase
            .from('items')
            .update(safeUpdates)
            .in('id', batch)

          if (error) {
            errors.push(error.message)
            failed += batch.length
          } else {
            success += count || batch.length
          }
          break
        }

        case 'update_vendor_status': {
          if (!['group_admin', 'group_cao'].includes(profile.role)) {
            return NextResponse.json({ error: 'Insufficient permissions to update vendor status' }, { status: 403 })
          }

          const newStatus = updates?.status
          if (!newStatus || !['active', 'inactive', 'under_review'].includes(newStatus as string)) {
            return NextResponse.json({ error: 'Invalid vendor status' }, { status: 400 })
          }

          // Only group_admin can blacklist
          if (newStatus === 'blacklisted' && profile.role !== 'group_admin') {
            return NextResponse.json({ error: 'Only group admin can blacklist vendors' }, { status: 403 })
          }

          const { error, count } = await supabase
            .from('vendors')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .in('id', batch)

          if (error) {
            errors.push(error.message)
            failed += batch.length
          } else {
            success += count || batch.length
          }
          break
        }

        default:
          return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
      }
    }

    // Log bulk action to activity_log
    await supabase.from('activity_log').insert({
      action: `bulk_${action}`,
      entity_type: body.entity_type || action,
      user_id: user.id,
      details: JSON.stringify({
        total: ids.length,
        success,
        failed,
        errors: errors.slice(0, 10),
        updates,
      }),
    })

    return NextResponse.json({ success, failed, errors })
  } catch (err) {
    console.error('Bulk operation failed:', err)
    return NextResponse.json(
      { error: 'Internal server error', success: 0, failed: 0, errors: [(err as Error).message] },
      { status: 500 }
    )
  }
}
