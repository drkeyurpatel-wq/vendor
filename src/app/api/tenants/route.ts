import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { tenantCreateSchema } from '@/lib/validations'

// GET: Get current user's tenant info
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, is_owner, tenant:tenants(*)')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    return NextResponse.json({ tenant: null, message: 'No tenant assigned' })
  }

  return NextResponse.json({ tenant: tenantUser.tenant, is_owner: tenantUser.is_owner })
}

// POST: Create a new tenant (for onboarding new hospitals)
export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimit(req, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = tenantCreateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { name, slug } = parsed.data

  // Check if slug is taken
  const { data: existing } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'This slug is already taken' }, { status: 409 })
  }

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      is_active: true,
      subscription_plan: 'basic',
      max_centres: 5,
      max_users: 20,
    })
    .select()
    .single()

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  // Link creating user as owner
  await supabase.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    is_owner: true,
  })

  // Set tenant_id on user profile
  await supabase
    .from('user_profiles')
    .update({ tenant_id: tenant.id })
    .eq('id', user.id)

  return NextResponse.json({ tenant, message: 'Tenant created successfully' })
}
