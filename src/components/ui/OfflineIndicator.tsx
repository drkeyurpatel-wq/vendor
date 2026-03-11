'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { syncOfflineQueue } from '@/lib/service-worker'

export default function OfflineIndicator() {
  const { isOnline, pendingCount } = useOnlineStatus()
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline) {
      // Just came back online
      setShowReconnected(true)
      setWasOffline(false)

      // Auto-sync pending requests
      if (pendingCount > 0) {
        setSyncing(true)
        syncOfflineQueue().finally(() => {
          setSyncing(false)
        })
      }

      // Auto-dismiss the reconnected banner after 4 seconds
      const timer = setTimeout(() => setShowReconnected(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline, pendingCount])

  // Nothing to show
  if (isOnline && !showReconnected) return null

  // Reconnected banner
  if (isOnline && showReconnected) {
    return (
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-300"
        style={{ backgroundColor: '#0D7E8A' }}
      >
        {syncing ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            Back online! Syncing {pendingCount} pending item{pendingCount !== 1 ? 's' : ''}...
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            Back online! {pendingCount > 0 ? 'All changes synced.' : 'Connected.'}
          </>
        )}
      </div>
    )
  }

  // Offline banner
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: '#1B3A6B' }}
    >
      <WifiOff size={16} />
      <span>You&apos;re offline. Changes will sync when connected.</span>
      {pendingCount > 0 && (
        <span
          className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold"
          style={{ backgroundColor: '#0D7E8A' }}
        >
          {pendingCount} pending
        </span>
      )}
    </div>
  )
}
