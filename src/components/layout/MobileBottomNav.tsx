'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ScanLine, ClipboardList, Bell } from 'lucide-react'

// `label` is the visible text, kept short to fit the 10px bottom-bar slot.
// `fullLabel` is what screen readers announce, where abbreviations are unhelpful.
const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Home', fullLabel: 'Dashboard' },
  { href: '/grn/new', icon: ScanLine, label: 'Scan GRN', fullLabel: 'New goods receipt note' },
  { href: '/purchase-orders', icon: ClipboardList, label: 'POs', fullLabel: 'Purchase orders' },
  { href: '/inventory/expiry-alerts', icon: Bell, label: 'Alerts', fullLabel: 'Expiry alerts' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom"
      aria-label="Primary"
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.fullLabel}
              className={cn('flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
                isActive ? 'text-navy-600' : 'text-gray-500')}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} aria-hidden="true" />
              <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
