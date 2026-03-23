'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const HEARTBEAT_INTERVAL = 5 * 60 * 1000 // 5 minutes
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes

/**
 * Client-side heartbeat that pings /api/auth/heartbeat on user activity.
 * Redirects to /login when the session times out due to inactivity.
 */
export default function SessionHeartbeat() {
  const router = useRouter()
  const supabase = createClient()

  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/heartbeat')
      if (!res.ok) {
        router.push('/login?timeout=1')
      }
    } catch {
      // Network error — skip this beat
    }
  }, [router])

  useEffect(() => {
    let lastActivity = Date.now()
    let heartbeatTimer: ReturnType<typeof setInterval>
    let inactivityTimer: ReturnType<typeof setTimeout>

    function resetInactivityTimer() {
      lastActivity = Date.now()
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        // Force logout after inactivity
        supabase.auth.signOut().then(() => {
          router.push('/login?timeout=1')
        })
      }, INACTIVITY_TIMEOUT)
    }

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const onActivity = () => {
      const now = Date.now()
      // Only reset timer if we haven't recorded activity recently (debounce 30s)
      if (now - lastActivity > 30_000) {
        resetInactivityTimer()
      }
    }

    activityEvents.forEach(evt => document.addEventListener(evt, onActivity, { passive: true }))

    // Periodic heartbeat to keep session cookie fresh
    heartbeatTimer = setInterval(() => {
      if (Date.now() - lastActivity < INACTIVITY_TIMEOUT) {
        sendHeartbeat()
      }
    }, HEARTBEAT_INTERVAL)

    // Initial timer
    resetInactivityTimer()

    return () => {
      clearInterval(heartbeatTimer)
      clearTimeout(inactivityTimer)
      activityEvents.forEach(evt => document.removeEventListener(evt, onActivity))
    }
  }, [sendHeartbeat, supabase.auth, router])

  return null
}
