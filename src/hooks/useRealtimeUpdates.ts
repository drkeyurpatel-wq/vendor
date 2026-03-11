'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

interface RealtimeFilter {
  column?: string
  value?: string
}

/**
 * Subscribe to INSERT/UPDATE/DELETE on a Supabase table with optional filters.
 * Returns the latest payload so components can react.
 */
export function useRealtimeTable<T extends { [key: string]: any } = { [key: string]: any }>(
  table: string,
  filter?: RealtimeFilter,
  callback?: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const [lastEvent, setLastEvent] = useState<RealtimePostgresChangesPayload<T> | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const supabase = createClient()

    const channelName = `realtime-${table}-${filter?.column || 'all'}-${filter?.value || 'all'}-${Date.now()}`

    const filterStr = filter?.column && filter?.value
      ? `${filter.column}=eq.${filter.value}`
      : undefined

    const channelConfig: any = {
      event: '*',
      schema: 'public',
      table,
    }
    if (filterStr) {
      channelConfig.filter = filterStr
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload: any) => {
        setLastEvent(payload)
        callbackRef.current?.(payload)
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          // Attempt reconnection after a brief delay
          setTimeout(() => {
            channel.unsubscribe()
            channel.subscribe()
          }, 3000)
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [table, filter?.column, filter?.value])

  return lastEvent
}

/**
 * Watch PO approval updates for a specific purchase order.
 */
export function usePOApprovalUpdates(
  poId: string | null,
  callback?: (payload: any) => void
) {
  return useRealtimeTable(
    'po_approvals',
    poId ? { column: 'po_id', value: poId } : undefined,
    callback
  )
}

/**
 * Watch item_centre_stock for low stock alerts at a specific centre.
 */
export function useStockAlerts(
  centreId: string | null,
  callback?: (payload: any) => void
) {
  return useRealtimeTable(
    'item_centre_stock',
    centreId ? { column: 'centre_id', value: centreId } : undefined,
    callback
  )
}

/**
 * Returns unread notification count by watching activity_log for a user's relevant events.
 * Notifications are considered "unread" if created after the last read timestamp.
 */
export function useNotificationCount(userId: string | null) {
  const [count, setCount] = useState(0)
  const [lastReadAt, setLastReadAt] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Load last read timestamp from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && userId) {
      const stored = localStorage.getItem(`h1_notif_read_${userId}`)
      setLastReadAt(stored)
    }
  }, [userId])

  // Fetch initial count
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const fetchCount = async () => {
      let query = supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })

      if (lastReadAt) {
        query = query.gt('created_at', lastReadAt)
      }

      const { count: total } = await query
      setCount(total || 0)
    }

    fetchCount()
  }, [userId, lastReadAt])

  // Subscribe to new activity_log entries
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notif-count-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_log',
      }, () => {
        setCount(prev => prev + 1)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString()
    if (userId && typeof window !== 'undefined') {
      localStorage.setItem(`h1_notif_read_${userId}`, now)
    }
    setLastReadAt(now)
    setCount(0)
  }, [userId])

  return { count, markAllRead }
}

/**
 * Returns recent notifications from activity_log with realtime updates.
 */
export function useRealtimeNotifications(userId: string | null, limit: number = 20) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial notifications
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const fetchNotifications = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('activity_log')
        .select('*, user:user_profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit)

      setNotifications(data || [])
      setLoading(false)
    }

    fetchNotifications()
  }, [userId, limit])

  // Subscribe to new entries
  useRealtimeTable('activity_log', undefined, (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setNotifications(prev => [payload.new, ...prev].slice(0, limit))
    }
  })

  return { notifications, loading }
}
