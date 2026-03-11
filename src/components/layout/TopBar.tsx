'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { UserProfile } from '@/types/database'
import { formatDate } from '@/lib/utils'

interface TopBarProps {
  user: UserProfile
  title?: string
  onMenuClick?: () => void
}

export default function TopBar({ user, title, onMenuClick }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-10">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors flex-shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors, POs, items..."
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Date */}
        <span className="text-sm text-gray-500 hidden md:block">{formatDate(new Date())}</span>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1B3A6B] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block">
            {user.full_name.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  )
}
