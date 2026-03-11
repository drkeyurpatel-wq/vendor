import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import CentresManager from './CentresManager'

export default async function CentresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['group_admin', 'group_cao'].includes(currentProfile.role)) {
    return (
      <div>
        <h1 className="page-title mb-4">Centre Management</h1>
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Access Restricted</p>
          <p className="text-sm text-gray-400 mt-1">Only Group Admin or Group CAO can manage centres</p>
        </div>
      </div>
    )
  }

  const { data: centres } = await supabase
    .from('centres')
    .select('*')
    .order('code')

  return <CentresManager initialCentres={centres ?? []} userRole={currentProfile.role} />
}
