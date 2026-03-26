'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, ExternalLink, Check, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeTable } from '@/hooks/useRealtimeUpdates'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  is_read: boolean
  user?: { full_name: string } | null
}

interface RealtimeNotificationBellProps {
  userId: string
}

const ACTION_LABELS: Record<string, string> = {
  po_created: 'New PO Created',
  po_approved: 'PO Approved',
  po_rejected: 'PO Rejected',
  po_sent_to_vendor: 'PO Sent to Vendor',
  grn_submitted: 'GRN Submitted',
  grn_verified: 'GRN Verified',
  invoice_created: 'New Invoice',
  invoice_approved: 'Invoice Approved',
  invoice_matched: 'Invoice Matched',
  invoice_mismatch: '3-Way Match Failed',
  payment_batch_created: 'Payment Batch Created',
  payment_batch_approved: 'Payment Batch Approved',
  vendor_created: 'New Vendor Added',
  vendor_blacklisted: 'Vendor Blacklisted',
  stock_low: 'Low Stock Alert',
  tally_push_success: 'Tally Sync Success',
  tally_push_failed: 'Tally Sync Failed',
}

function getEntityLink(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null
  const routes: Record<string, string> = {
    purchase_order: `/purchase-orders/${entityId}`,
    purchase: `/purchase-orders/${entityId}`,
    grn: `/grn/${entityId}`,
    invoice: `/finance/invoices`,
    vendor: `/vendors/${entityId}`,
    payment_batch: `/finance/payments`,
    item: `/items/${entityId}`,
  }
  return routes[entityType] || null
}

function getActionColor(action: string): string {
  if (action.includes('rejected') || action.includes('mismatch') || action.includes('failed') || action.includes('blacklisted')) {
    return 'bg-red-50 border-l-red-500'
  }
  if (action.includes('approved') || action.includes('matched') || action.includes('success')) {
    return 'bg-green-50 border-l-green-500'
  }
  if (action.includes('low') || action.includes('warning')) {
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

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, details, created_at, is_read')
      .or(`target_user_id.eq.${userId},target_user_id.is.null`)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(30)

    const items = (data || []) as unknown as Notification[]
    setNotifications(items)
    setUnreadCount(items.filter((n) => !n.is_read).length)
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time: listen for new activity_log entries
  useRealtimeTable('activity_log', undefined, useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newRow = payload.new as Record<string, unknown>
      const targetUserId = newRow?.target_user_id as string | null

      if (!targetUserId || targetUserId === userId) {
        const newNotification: Notification = {
          id: newRow.id as string,
          action: newRow.action as string,
          entity_type: newRow.entity_type as string | null,
          entity_id: newRow.entity_id as string | null,
          details: newRow.details as Record<string, unknown> | null,
          created_at: newRow.created_at as string,
          is_read: false,
          user: null,
        }
        setNotifications((prev) => [newNotification, ...prev].slice(0, 30))
        setUnreadCount((prev) => prev + 1)
        // Announce new notification to screen readers
        const srAnnounce = document.getElementById('sr-announce-polite')
        if (srAnnounce) {
          srAnnounce.textContent = ''
          requestAnimationFrame(() => {
            srAnnounce.textContent = `New notification: ${ACTION_LABELS[newNotification.action] || newNotification.action.replace(/_/g, ' ')}`
          })
        }
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
      .from('activity_log')
      .update({ is_read: true })
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
      .from('activity_log')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
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
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1" aria-live="polite" aria-atomic="true">
            <span className="text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
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

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No notifications in the last 7 days
              </div>
            )}
            {notifications.map((notification) => {
              const link = getEntityLink(notification.entity_type, notification.entity_id)
              const label = ACTION_LABELS[notification.action] || notification.action.replace(/_/g, ' ')
              const colorClass = getActionColor(notification.action)
              const details = notification.details
              const entityRef = (details?.entity_ref as string) ||
                (details?.po_number as string) ||
                (details?.grn_number as string) || ''

              return (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-50 border-l-3 ${colorClass} ${
                    !notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50 opacity-75'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      {entityRef && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{entityRef}</p>
                      )}
                      {notification.user?.full_name && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          by {notification.user.full_name}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {link && (
                        <Link
                          href={link}
                          onClick={() => {
                            setIsOpen(false)
                            if (!notification.is_read) markAsRead(notification.id)
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-teal-50 text-teal-500 transition-colors"
                          title="View"
                          aria-label={`View ${label}`}
                        >
                          <ExternalLink size={13} aria-hidden="true" />
                        </Link>
                      )}
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-teal-50 text-gray-500 hover:text-teal-500 transition-colors"
                          title="Mark as read"
                          aria-label={`Mark ${label} as read`}
                        >
                          <Check size={13} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
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
