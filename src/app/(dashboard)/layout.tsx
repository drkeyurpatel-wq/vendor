import { requireAuth } from '@/lib/auth'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { UserProfile } from '@/types/database'
import DashboardShell from '@/components/layout/DashboardShell'
import RouteTransition from '@/components/motion/RouteTransition'
import { getLocale } from '@/i18n/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuth()
  // Read on the server so the first paint is already in the user's language.
  const locale = await getLocale()

  return (
    <DashboardShell user={profile as UserProfile} initialLocale={locale}>
      <Breadcrumbs />
      <RouteTransition>{children}</RouteTransition>
    </DashboardShell>
  )
}
