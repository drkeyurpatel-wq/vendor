import { createClient } from '@/lib/supabase/server'

export interface Tenant {
  id: string
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  primary_color: string
  accent_color: string
  is_active: boolean
  settings: Record<string, any>
  subscription_plan: string
  max_centres: number
  max_users: number
}

/**
 * Get the current user's tenant from the database.
 * Returns null if multi-tenant is not set up yet (tenant_id columns are null).
 * This allows the app to work in both single-tenant and multi-tenant modes.
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantUser.tenant_id)
    .single()

  return tenant as Tenant | null
}

/**
 * Check if a tenant has reached its resource limits.
 */
export async function checkTenantLimits(tenantId: string, resource: 'centres' | 'users'): Promise<{ allowed: boolean; current: number; max: number }> {
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('max_centres, max_users')
    .eq('id', tenantId)
    .single()

  if (!tenant) return { allowed: false, current: 0, max: 0 }

  if (resource === 'centres') {
    const { count } = await supabase
      .from('centres')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    return { allowed: (count ?? 0) < tenant.max_centres, current: count ?? 0, max: tenant.max_centres }
  }

  if (resource === 'users') {
    const { count } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    return { allowed: (count ?? 0) < tenant.max_users, current: count ?? 0, max: tenant.max_users }
  }

  return { allowed: true, current: 0, max: 0 }
}
