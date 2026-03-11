import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { grnSubmitSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    .select('id, status, po_id')
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
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: action === 'verify' ? 'grn_verified' : 'grn_discrepancy_flagged',
    entity_type: 'grn',
    entity_id: grn_id,
  })

  return NextResponse.json({ success: true, status: newStatus })
}
