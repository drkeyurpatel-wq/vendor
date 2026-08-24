'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { UserProfile, type UserRole } from '@/types/database'
import {
  LayoutDashboard, Users, Package, ShoppingCart, ClipboardList,
  FileText, CreditCard, BarChart2, Settings, ChevronDown,
  Building2, LogOut, TrendingDown, Warehouse, AlertTriangle,
  X, PanelLeftClose, PanelLeftOpen, Search, Heart,
  Boxes, CalendarClock, Receipt, PieChart, FileSignature,
} from 'lucide-react'
import {
  primaryNavFor, manageNavFor, isNavGroup,
  type NavIconName, type NavEntry,
} from '@/lib/nav'

const ICONS: Record<NavIconName, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  indent: <ClipboardList size={18} />,
  grn: <ClipboardList size={18} />,
  stock: <Boxes size={18} />,
  expiry: <AlertTriangle size={18} />,
  po: <ShoppingCart size={18} />,
  vendors: <Users size={18} />,
  contracts: <FileSignature size={18} />,
  invoices: <FileText size={18} />,
  schedule: <CalendarClock size={18} />,
  payments: <CreditCard size={18} />,
  debit: <Receipt size={18} />,
  overdue: <TrendingDown size={18} />,
  spend: <PieChart size={18} />,
  analytics: <BarChart2 size={18} />,
  items: <Package size={18} />,
  inventory: <Warehouse size={18} />,
  consignment: <Heart size={18} />,
  reports: <BarChart2 size={18} />,
  settings: <Settings size={18} />,
}
interface SidebarProps {
  user: UserProfile
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ user, collapsed = false, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const role = user.role as UserRole
  const primary = primaryNavFor(role)
  const manage = manageNavFor(role)
  const filteredNav: NavEntry[] = [...primary, ...manage]

  // Auto-expand the Manage group containing the active route
  useEffect(() => {
    const activeNav = manage.find(item => item.children.some(c => pathname.startsWith(c.href)))
    if (activeNav && !openGroups.includes(activeNav.label)) {
      setOpenGroups(prev => [...prev, activeNav.label])
    }
  }, [pathname])

  useEffect(() => {
    onMobileClose?.()
  }, [pathname])

  const toggleGroup = (label: string) => {
    if (collapsed) return // Don't toggle in collapsed mode
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside className={cn(
        'min-h-screen flex flex-col flex-shrink-0 z-50 transition-all duration-300',
        'bg-gradient-to-b from-navy-600 via-[#1a3766] to-[#152E56]',
        // Mobile: fixed, slide in/out
        'fixed lg:static',
        mobileOpen ? 'translate-x-0 shadow-2xl w-[260px]' : '-translate-x-full w-[260px]',
        // Desktop: always visible, collapse width
        'lg:translate-x-0',
        collapsed ? 'lg:w-[68px]' : 'lg:w-[260px]',
      )}
        role="complementary" aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className={cn('border-b border-white/[0.08] transition-all duration-300', collapsed ? 'px-2 py-4' : 'px-5 py-5')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/10">
              <span className="text-base font-extrabold text-navy-600 tracking-tight">H1</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm tracking-tight">Health1 VPMS</div>
                <div className="text-blue-300/70 text-[11px] font-medium">Purchase Management</div>
              </div>
            )}
            <button onClick={onMobileClose} className="lg:hidden text-blue-300/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10" aria-label="Close sidebar menu">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Centre pill */}
        {!collapsed && user.centre ? (
          <div className="mx-3 mt-4 mb-1 bg-white/[0.07] rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 border border-white/[0.06]">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 size={13} className="text-blue-200" />
            </div>
            <div className="min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user.centre.name}</div>
              <div className="text-blue-300/60 text-[11px] capitalize truncate">{user.role.replace(/_/g, ' ')}</div>
            </div>
          </div>
        ) : !collapsed ? (
          <div className="mx-3 mt-4 mb-1 bg-teal-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 border border-teal-500/20">
            <div className="w-7 h-7 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingDown size={13} className="text-teal-300" />
            </div>
            <div>
              <div className="text-white text-xs font-semibold">All Centres</div>
              <div className="text-teal-300/60 text-[11px]">Group Level Access</div>
            </div>
          </div>
        ) : null}

        {/* Cmd+K trigger in collapsed mode */}
        {collapsed && (
          <div className="mx-2 mt-3 mb-1">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="w-full h-10 flex items-center justify-center rounded-xl text-blue-300/50 hover:text-white hover:bg-white/10 transition-all"
              title="Search (⌘K)"
            >
              <Search size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className={cn('flex-1 py-3 overflow-y-auto', collapsed ? 'px-2' : 'px-3')} role="navigation" aria-label="Main navigation">
          <div className="space-y-0.5">
            {filteredNav.map(item => {
              // Direct link item
              if (!isNavGroup(item)) {
                const active = pathname === item.href
                return (
                  <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl text-[13px] transition-all duration-200',
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                      active
                        ? 'bg-white text-navy-600 font-semibold shadow-lg shadow-black/10'
                        : 'text-blue-200/80 hover:bg-white/[0.08] hover:text-white'
                    )}
                  >
                    <span className={cn('flex-shrink-0 transition-colors', active ? 'text-teal-500' : '')}>{ICONS[item.icon]}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                  </motion.div>
                )
              }

              // Group item
              const isOpen = openGroups.includes(item.label) && !collapsed
              const hasActiveChild = item.children.some(c => pathname.startsWith(c.href))

              return (
                <div key={item.label}>
                  <button
                    onClick={() => {
                      if (collapsed && item.children[0]) {
                        router.push(item.children[0].href)
                      } else {
                        toggleGroup(item.label)
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                    aria-expanded={isOpen}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl text-[13px] transition-all duration-200 text-left',
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                      hasActiveChild
                        ? collapsed ? 'bg-white/[0.15] text-white' : 'bg-white/[0.12] text-white font-semibold'
                        : 'text-blue-200/80 hover:bg-white/[0.08] hover:text-white'
                    )}
                  >
                    <span className="flex-shrink-0">{ICONS[item.icon]}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <span className={cn('transition-transform duration-200', isOpen ? 'rotate-0' : '-rotate-90')}>
                          <ChevronDown size={14} aria-hidden="true" />
                        </span>
                      </>
                    )}
                  </button>

                  {/* Sub-items — only when expanded */}
                  {!collapsed && (
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-200',
                        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className="ml-5 mt-1 mb-1 space-y-0.5 border-l-2 border-white/[0.08] pl-3">
                        {item.children.map(child => {
                          const active = pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'block px-3 py-1.5 rounded-lg text-[12.5px] transition-all duration-150',
                                active
                                  ? 'bg-teal-500 text-white font-medium shadow-md shadow-teal-500/20'
                                  : 'text-blue-300/60 hover:bg-white/[0.06] hover:text-blue-100'
                              )}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block px-3 py-2 border-t border-white/[0.06]">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-2 rounded-xl text-blue-300/50 hover:text-white hover:bg-white/[0.08] transition-all text-xs',
              collapsed ? 'justify-center' : ''
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : (
              <>
                <PanelLeftClose size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User section */}
        <div className={cn('border-t border-white/[0.08]', collapsed ? 'p-2' : 'p-3')}>
          <div className={cn(
            'flex items-center rounded-xl hover:bg-white/[0.06] transition-colors',
            collapsed ? 'justify-center py-2' : 'gap-3 px-2 py-2.5'
          )}>
            <div className={cn(
              'bg-gradient-to-br from-teal-500 to-[#0A9BA8] rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10',
              collapsed ? 'w-8 h-8' : 'w-9 h-9'
            )}>
              <span className={cn('text-white font-bold tracking-wide', collapsed ? 'text-[9px]' : 'text-[11px]')}>
                {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate leading-tight">{user.full_name}</div>
                  <div className="text-blue-300/50 text-[11px] truncate">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-blue-300/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={15} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
