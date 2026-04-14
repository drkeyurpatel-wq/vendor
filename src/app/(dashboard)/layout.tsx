import { requireAuth } from '@/lib/auth'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { UserProfile } from '@/types/database'
import DashboardShell from '@/components/layout/DashboardShell'
import RouteTransition from '@/components/motion/RouteTransition'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth()

  return (
    <DashboardShell user={profile as UserProfile}>
      <Breadcrumbs />
      <RouteTransition>{children}</RouteTransition>
    </DashboardShell>
  )
}
