'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ScanLine, ClipboardList, Bell } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/grn/new', icon: ScanLine, label: 'Scan GRN' },
  { href: '/purchase-orders', icon: ClipboardList, label: 'POs' },
  { href: '/inventory/expiry-alerts', icon: Bell, label: 'Alerts' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
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
