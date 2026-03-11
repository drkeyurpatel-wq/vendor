'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOfflineQueueCount } from '@/lib/service-worker'

interface OnlineStatus {
  isOnline: boolean
  pendingCount: number
  refreshPendingCount: () => Promise<void>
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getOfflineQueueCount()
      setPendingCount(count)
    } catch {
      // IndexedDB may not be available
    }
  }, [])

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)
    refreshPendingCount()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for SW messages about queue updates
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OFFLINE_QUEUE_UPDATED' || event.data?.type === 'SYNC_COMPLETE') {
        refreshPendingCount()
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    // Poll pending count periodically (every 10s) in case SW messages are missed
    const interval = setInterval(refreshPendingCount, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
      clearInterval(interval)
    }
  }, [refreshPendingCount])

  return { isOnline, pendingCount, refreshPendingCount }
}
