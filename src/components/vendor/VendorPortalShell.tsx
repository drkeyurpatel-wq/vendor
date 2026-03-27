'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, FileText, CreditCard,
  AlertTriangle, FileQuestion, Menu, X, LogOut, Phone
} from 'lucide-react'

interface VendorPortalShellProps {
  vendorName: string
  vendorCode: string
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/vendor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/vendor/orders', label: 'Purchase Orders', icon: ShoppingCart },
  { href: '/vendor/invoices', label: 'Invoices', icon: FileText },
  { href: '/vendor/payments', label: 'Payments', icon: CreditCard },
  { href: '/vendor/outstanding', label: 'Outstanding', icon: AlertTriangle },
  { href: '/vendor/rfqs', label: 'Quotations', icon: FileQuestion },
]

export default function VendorPortalShell({ vendorName, vendorCode, children }: VendorPortalShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    await fetch('/api/vendor-auth/logout', { method: 'POST' })
    window.location.href = '/vendor/login'
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Name */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/vendor" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-[#1B3A6B] to-[#0D7E8A] rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-sm font-extrabold text-white tracking-tight">H1</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-gray-900 leading-tight">Health1</div>
                  <div className="text-[10px] text-gray-500 font-medium leading-tight">Vendor Portal</div>
                </div>
              </Link>
            </div>

            {/* Vendor Info + Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-gray-900 leading-tight">{vendorName}</div>
                <div className="text-[11px] text-gray-500 font-mono">{vendorCode}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:block border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                      active
                        ? 'border-[#0D7E8A] text-[#0D7E8A]'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    )}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <nav className="py-2 px-4">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-[#0D7E8A]/10 text-[#0D7E8A]'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-gray-100 mt-2 pt-2 px-4 py-2">
                <div className="text-sm font-semibold text-gray-900">{vendorName}</div>
                <div className="text-xs text-gray-500 font-mono">{vendorCode}</div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Help Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-500">
          <span>Health1 Super Speciality Hospitals Pvt. Ltd.</span>
          <a href="tel:+917940000000" className="flex items-center gap-1 hover:text-[#0D7E8A] transition-colors">
            <Phone size={12} /> Support
          </a>
        </div>
      </footer>
    </div>
  )
}
