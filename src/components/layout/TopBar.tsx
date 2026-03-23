'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Search, LogOut, Settings, User, ChevronDown, Building2 } from 'lucide-react'
import { UserProfile } from '@/types/database'
import { formatDate, formatDateTime } from '@/lib/utils'
import RealtimeNotificationBell from '@/components/ui/RealtimeNotificationBell'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface TopBarProps {
  user: UserProfile
  title?: string
  onMenuClick?: () => void
}

export default function TopBar({ user, title, onMenuClick }: TopBarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const triggerCommandPalette = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  const initials = user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="h-[56px] bg-white/90 backdrop-blur-xl border-b border-gray-200/60 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-all flex-shrink-0" aria-label="Open menu">
        <Menu size={20} />
      </button>

      <button onClick={triggerCommandPalette} className="flex-1 max-w-md h-9 flex items-center gap-2.5 px-3 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all cursor-text">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <span className="flex-1 text-left">Search vendors, items, POs...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 h-5 px-1.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded shadow-sm">
          <span className="text-[11px]">&#x2318;</span>K
        </kbd>
      </button>

      <div className="flex items-center gap-2 ml-auto">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 rounded-lg border border-gray-100">
          <span className="text-[12px] font-medium text-gray-500">{formatDate(new Date())}</span>
        </div>

        <RealtimeNotificationBell userId={user.id} />

        <div className="w-px h-6 bg-gray-200 hidden md:block" />

        {/* Clickable user menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#1B3A6B] to-[#234880] rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold tracking-wide">{initials}</span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-gray-800 leading-tight">{user.full_name.split(' ')[0]}</div>
              <div className="text-[10px] text-gray-400 capitalize leading-tight">{user.role.replace(/_/g, ' ')}</div>
            </div>
            <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 animate-scale-in">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1B3A6B] to-[#234880] rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    <div className="text-[10px] text-[#0D7E8A] font-medium capitalize mt-0.5">{user.role.replace(/_/g, ' ')}</div>
                  </div>
                </div>
                {user.centre && (
                  <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <Building2 size={12} className="text-gray-400" />
                    {user.centre.name}
                  </div>
                )}
                {(user as any).last_login_at && (
                  <div className="text-[10px] text-gray-400 mt-1.5 px-2.5">
                    Last login: {formatDateTime(new Date((user as any).last_login_at))}
                  </div>
                )}
              </div>

              <div className="py-1">
                <Link href="/settings/users" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings size={15} className="text-gray-400" /> Settings
                </Link>
                <Link href="/settings/audit-log" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <User size={15} className="text-gray-400" /> Audit Log
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
