'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import { UserProfile } from '@/types/database'
import { registerServiceWorker, syncOfflineQueue } from '@/lib/service-worker'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

interface DashboardShellProps {
  user: UserProfile
  children: React.ReactNode
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isOnline } = useOnlineStatus()

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
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#1B3A6B] focus:text-white focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineIndicator />
        <TopBar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto p-4 lg:p-7"
          tabIndex={-1}
        >
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
