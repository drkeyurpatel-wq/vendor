'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Boxes, AlertTriangle, ShoppingCart,
  Users, FileSignature, FileText, CalendarClock, CreditCard, Receipt,
  TrendingDown, PieChart, BarChart2, Package, Warehouse, Heart, Settings, ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { mobileNavFor, type NavIconName } from '@/lib/nav'
import type { UserRole } from '@/types/database'

const ICONS: Record<NavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  indent: ClipboardList,
  grn: ClipboardList,
  stock: Boxes,
  expiry: AlertTriangle,
  po: ShoppingCart,
  vendors: Users,
  contracts: FileSignature,
  invoices: FileText,
  schedule: CalendarClock,
  payments: CreditCard,
  debit: Receipt,
  overdue: TrendingDown,
  spend: PieChart,
  analytics: BarChart2,
  items: Package,
  inventory: Warehouse,
  consignment: Heart,
  reports: BarChart2,
  settings: Settings,
  approvals: ShieldCheck,
}

export default function MobileBottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const items = mobileNavFor(role)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map(item => {
          const Icon = ICONS[item.icon]
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors',
                isActive ? 'text-navy-600' : 'text-gray-500')}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
