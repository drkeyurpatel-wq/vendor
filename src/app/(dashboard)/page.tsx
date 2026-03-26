import { requireAuth } from '@/lib/auth'
import type { UserRole } from '@/types/database'
import MyActions from '@/components/dashboard/MyActions'
import GroupAdminDashboard from '@/components/dashboard/GroupAdminDashboard'
import GroupCAODashboard from '@/components/dashboard/GroupCAODashboard'
import UnitCAODashboard from '@/components/dashboard/UnitCAODashboard'
import PurchaseManagerDashboard from '@/components/dashboard/PurchaseManagerDashboard'
import StoreStaffDashboard from '@/components/dashboard/StoreStaffDashboard'
import FinanceStaffDashboard from '@/components/dashboard/FinanceStaffDashboard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const DASHBOARD_MAP: Record<UserRole, React.ComponentType<{ profile: any }>> = {
  group_admin: GroupAdminDashboard,
  group_cao: GroupCAODashboard,
  unit_cao: UnitCAODashboard,
  unit_purchase_manager: PurchaseManagerDashboard,
  store_staff: StoreStaffDashboard,
  finance_staff: FinanceStaffDashboard,
  vendor: () => null, // Vendors use /vendor-portal
}

export default async function DashboardPage() {
  const { user, profile, role } = await requireAuth()

  const Dashboard = DASHBOARD_MAP[role]
  if (!Dashboard) redirect('/login')

  return (
    <>
      <MyActions userId={user.id} role={role} centreId={profile.centre_id} userName={profile.full_name} />
      <Dashboard profile={profile} />
    </>
  )
}
