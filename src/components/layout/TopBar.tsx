'use client'

import { Menu } from 'lucide-react'
import { UserProfile } from '@/types/database'
import { formatDate } from '@/lib/utils'
import RealtimeNotificationBell from '@/components/ui/RealtimeNotificationBell'
import GlobalSearch from '@/components/ui/GlobalSearch'

interface TopBarProps {
  user: UserProfile
  title?: string
  onMenuClick?: () => void
}

export default function TopBar({ user, title, onMenuClick }: TopBarProps) {
  return (
    <header className="h-[60px] bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-all flex-shrink-0"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Date */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-lg border border-gray-100">
          <span className="text-[12px] font-medium text-gray-500">{formatDate(new Date())}</span>
        </div>

        {/* Notifications */}
        <RealtimeNotificationBell userId={user.id} />

        {/* Divider */}
        <div className="w-px h-7 bg-gray-200 hidden md:block" />

        {/* User */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1B3A6B] to-[#234880] rounded-xl flex items-center justify-center shadow-md shadow-[#1B3A6B]/10">
            <span className="text-white text-[10px] font-bold tracking-wide">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-gray-800 leading-tight">
              {user.full_name.split(' ')[0]}
            </div>
            <div className="text-[10px] text-gray-400 capitalize leading-tight">
              {user.role.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
