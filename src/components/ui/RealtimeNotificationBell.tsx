'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, ExternalLink, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeTable } from '@/hooks/useRealtimeUpdates'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string | null
  message: string | null
  entity_type: string | null
  entity_id: string | null
  priority: string | null
  created_at: string
  is_read: boolean
}

interface RealtimeNotificationBellProps {
  userId: string
}

function getEntityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null
  const routes: Record<string, string> = {
    purchase_order: `/purchase-orders/${entityId}`,
    purchase: `/purchase-orders/${entityId}`,
    grn: `/grn/${entityId}`,
    invoice: `/finance/invoices/${entityId}`,
    vendor: `/vendors/${entityId}`,
    payment_batch: `/finance/payments/${entityId}`,
    item: `/items/${entityId}`,
  }
  return routes[entityType] || null
}

function getActionColor(type: string): string {
  if (type.includes('rejected') || type.includes('mismatch') || type.includes('failed') || type.includes('blacklisted')) {
    return 'bg-red-50 border-l-red-500'
  }
  if (type.includes('approved') || type.includes('matched') || type.includes('success')) {
    return 'bg-green-50 border-l-green-500'
  }
  if (type.includes('low') || type.includes('warning') || type.includes('overdue') || type.includes('escalat')) {
    return 'bg-yellow-50 border-l-yellow-500'
  }
  return 'bg-white border-l-teal-500'
}

export default function RealtimeNotificationBell({ userId }: RealtimeNotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, entity_type, entity_id, priority, created_at, is_read')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(30)

    const items = (data || []) as Notification[]
    setNotifications(items)
    setUnreadCount(items.filter((n) => !n.is_read).length)
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time: listen for new notifications
  useRealtimeTable('notifications', undefined, useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      const row = payload.new as Record<string, unknown>
      if (row?.user_id === userId || !row?.user_id) {
        const n: Notification = {
          id: row.id as string,
          type: (row.type as string) || '',
          title: (row.title as string) || null,
          message: (row.message as string) || null,
          entity_type: (row.entity_type as string) || null,
          entity_id: (row.entity_id as string) || null,
          priority: (row.priority as string) || null,
          created_at: (row.created_at as string) || new Date().toISOString(),
          is_read: false,
        }
        setNotifications((prev) => [n, ...prev].slice(0, 30))
        setUnreadCount((prev) => prev + 1)
      }
    }
  }, [userId]))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label={unreadCount > 0 ? `Notifications: ${unreadCount} unread` : 'Notifications: none unread'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={17} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
            <span className="text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-navy-50">
            <h3 className="text-sm font-semibold text-navy-600">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-teal-500 hover:text-navy-600 font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications in the last 7 days
              </div>
            )}
            {notifications.map((n) => {
              const link = getEntityLink(n.entity_type, n.entity_id)
              const label = n.title || n.type.replace(/_/g, ' ')
              const colorClass = getActionColor(n.type)

              return (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 border-l-3 ${colorClass} ${
                    !n.is_read ? 'bg-opacity-100' : 'bg-opacity-50 opacity-75'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {link && (
                        <Link
                          href={link}
                          onClick={() => {
                            setIsOpen(false)
                            if (!n.is_read) markAsRead(n.id)
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-teal-50 text-teal-500 transition-colors"
                          title="View"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      )}
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-teal-50 text-gray-500 hover:text-teal-500 transition-colors"
                          title="Mark as read"
                        >
                          <Check size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <Link
              href="/settings/audit-log"
              onClick={() => setIsOpen(false)}
              className="text-xs text-teal-500 hover:text-navy-600 font-medium transition-colors"
            >
              View all activity
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
