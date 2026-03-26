import { withApiErrorHandler } from '@/lib/api-error-handler'
import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { grnSubmitSchema } from '@/lib/validations'
import { sendInAppNotification } from '@/lib/notify-server'

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = grnSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { grn_id, action } = parsed.data

  const { data: grn } = await supabase
    .from('grns')
    .select('id, status, po_id, grn_number')
    .eq('id', grn_id)
    .single()

  if (!grn) {
    return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
  }

  const newStatus = action === 'verify' ? 'verified' : 'discrepancy'
  const now = new Date().toISOString()

  await supabase.from('grns')
    .update({ status: newStatus, updated_at: now })
    .eq('id', grn_id)

  // Log activity
  const auditAction = action === 'verify' ? 'grn_verified' : 'grn_discrepancy_flagged'
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: auditAction,
    entity_type: 'grn',
    entity_id: grn_id,
  })

  // Notify: in-app to relevant users
  sendInAppNotification(supabase, {
    action: auditAction as any,
    entity_type: 'grn',
    entity_id: grn_id,
    details: { grn_number: grn.grn_number },
    actor_user_id: user.id,
  }).catch(() => {})

  return NextResponse.json({ success: true, status: newStatus })
})
