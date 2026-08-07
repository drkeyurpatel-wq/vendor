import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { UserProfile } from '@/types/database'
import DashboardShell from '@/components/layout/DashboardShell'
import RouteTransition from '@/components/motion/RouteTransition'
import { getLocale } from '@/i18n/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, role } = await requireAuth()

  // Vendors authenticate by phone OTP against the portal at /vendor/*, not with
  // a Supabase account. A user_profiles row carrying role 'vendor' is therefore
  // obsolete, and must not fall through to the staff navigation and pages.
  if (role === 'vendor') redirect('/vendor/login')
  // Read on the server so the first paint is already in the user's language.
  const locale = await getLocale()

  return (
    <DashboardShell user={profile as UserProfile} initialLocale={locale}>
      <Breadcrumbs />
      <RouteTransition>{children}</RouteTransition>
    </DashboardShell>
  )
}
