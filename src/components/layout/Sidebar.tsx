'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserProfile } from '@/types/database'
import {
  LayoutDashboard, Users, Package, ShoppingCart, ClipboardList,
  FileText, CreditCard, BarChart2, Settings, ChevronDown, ChevronRight,
  Building2, LogOut, TrendingDown
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
  roles?: string[]
}

const VENDOR_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
  { label: 'My Portal', href: '/vendor-portal', icon: <Package size={18} />, roles: ['vendor'] },
]

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
  {
    label: 'Vendors', icon: <Users size={18} />,
    children: [
      { label: 'Vendor Master', href: '/vendors' },
      { label: 'Add Vendor', href: '/vendors/new' },
      { label: 'Categories', href: '/vendors/categories' },
    ]
  },
  {
    label: 'Items / SKUs', icon: <Package size={18} />,
    children: [
      { label: 'Item Master', href: '/items' },
      { label: 'Add Item', href: '/items/new' },
      { label: 'Stock Levels', href: '/items/stock' },
      { label: 'Consumption Import', href: '/items/consumption' },
    ]
  },
  {
    label: 'Purchase', icon: <ShoppingCart size={18} />,
    children: [
      { label: 'Purchase Indents', href: '/purchase-orders/indents' },
      { label: 'Purchase Orders', href: '/purchase-orders' },
      { label: 'New PO', href: '/purchase-orders/new' },
    ]
  },
  {
    label: 'GRN', icon: <ClipboardList size={18} />,
    children: [
      { label: 'All GRNs', href: '/grn' },
      { label: 'New GRN', href: '/grn/new' },
    ]
  },
  {
    label: 'Finance', icon: <CreditCard size={18} />,
    children: [
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'New Invoice', href: '/finance/invoices/new' },
      { label: 'Credit Period', href: '/finance/credit' },
      { label: 'Payment Batches', href: '/finance/payments' },
      { label: 'New Batch', href: '/finance/payments/new' },
    ]
  },
  {
    label: 'Reports', icon: <BarChart2 size={18} />,
    children: [
      { label: 'Overview', href: '/reports' },
      { label: 'AI Analytics', href: '/analytics' },
      { label: 'Vendor Performance', href: '/reports/vendor-performance' },
    ]
  },
  {
    label: 'Settings', icon: <Settings size={18} />,
    roles: ['group_admin', 'group_cao'],
    children: [
      { label: 'Centres', href: '/settings/centres' },
      { label: 'Users', href: '/settings/users' },
      { label: 'Approval Matrix', href: '/settings/approvals' },
      { label: 'Rate Contracts', href: '/settings/rate-contracts' },
      { label: 'Data Import', href: '/settings/data-import' },
    ]
  },
]

interface SidebarProps {
  user: UserProfile
  collapsed?: boolean
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [openGroups, setOpenGroups] = useState<string[]>(['Purchase', 'Vendors'])

  const toggleGroup = (label: string) => {
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Vendor users get a simplified nav
  const baseNav = user.role === 'vendor' ? VENDOR_NAV : NAV
  const filteredNav = baseNav.filter(item =>
    !item.roles || item.roles.includes(user.role)
  )

  return (
    <div className="w-60 min-h-screen bg-[#1B3A6B] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[#1B3A6B]">H1</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Health1 VPMS</div>
            <div className="text-blue-300 text-xs">Purchase Management</div>
          </div>
        </div>
      </div>

      {/* Centre pill */}
      {user.centre && (
        <div className="mx-3 mt-3 mb-1 bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <Building2 size={13} className="text-blue-300 flex-shrink-0" />
          <div>
            <div className="text-white text-xs font-semibold">{user.centre.name}</div>
            <div className="text-blue-300 text-[11px]">{user.role.replace(/_/g, ' ')}</div>
          </div>
        </div>
      )}
      {!user.centre && (
        <div className="mx-3 mt-3 mb-1 bg-[#0D7E8A]/40 rounded-lg px-3 py-2 flex items-center gap-2">
          <TrendingDown size={13} className="text-teal-300 flex-shrink-0" />
          <div>
            <div className="text-white text-xs font-semibold">All Centres</div>
            <div className="text-teal-300 text-[11px]">Group Level Access</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {filteredNav.map(item => {
          if (item.href) {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-white text-[#1B3A6B] font-semibold'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          }

          const isOpen = openGroups.includes(item.label)
          const hasActiveChild = item.children?.some(c => pathname.startsWith(c.href))

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                  hasActiveChild
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isOpen && item.children && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                  {item.children.map(child => {
                    const active = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block px-3 py-1.5 rounded-lg text-[13px] transition-colors',
                          active
                            ? 'bg-[#0D7E8A] text-white font-medium'
                            : 'text-blue-300 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-[#0D7E8A] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.full_name}</div>
            <div className="text-blue-300 text-xs truncate">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-blue-300 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
