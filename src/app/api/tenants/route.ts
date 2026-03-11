import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug must be lowercase letters, numbers, and hyphens only' }, { status: 400 })
  }

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
