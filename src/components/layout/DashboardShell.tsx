'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import CommandPalette from '@/components/ui/CommandPalette'
import MobileBottomNav from './MobileBottomNav'
import { UserProfile } from '@/types/database'
import { registerServiceWorker, syncOfflineQueue } from '@/lib/service-worker'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface DashboardShellProps {
  user: UserProfile
  children: React.ReactNode
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const { isOnline } = useOnlineStatus()

  // Restore sidebar state after hydration
  useEffect(() => {
    const saved = localStorage.getItem('vpms-sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
    setHasHydrated(true)
  }, [])

  // Only persist AFTER initial hydration (prevents saving default on first load)
  useEffect(() => {
    if (hasHydrated) {
      localStorage.setItem('vpms-sidebar-collapsed', String(collapsed))
    }
  }, [collapsed, hasHydrated])

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (isOnline) {
      syncOfflineQueue()
    }
  }, [isOnline])

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FA]">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-navy-600 focus:text-white focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineIndicator />
        <TopBar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto p-4 lg:p-7 pb-20 md:pb-4"
          tabIndex={-1}
        >
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Command Palette — available everywhere */}
      <CommandPalette />
      <MobileBottomNav />
    </div>
  )
}
