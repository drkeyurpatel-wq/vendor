import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { UserProfile } from '@/types/database'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <DashboardShell user={profile as UserProfile}>
      <Breadcrumbs />
      {children}
    </DashboardShell>
  )
}
