import { requireAuth } from '@/lib/auth'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { UserProfile } from '@/types/database'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth()

  return (
    <DashboardShell user={profile as UserProfile}>
      <Breadcrumbs />
      {children}
    </DashboardShell>
  )
}
