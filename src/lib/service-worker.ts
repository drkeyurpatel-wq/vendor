/**
 * Service Worker registration and offline queue utilities.
 * Import this in client components that need offline support.
 */

const OFFLINE_QUEUE_DB = 'h1-vpms-offline-queue'
const OFFLINE_QUEUE_STORE = 'requests'

// ──────────────────────────────────────────────
// Service Worker Registration
// ──────────────────────────────────────────────
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // New SW activated — could prompt user to refresh
            console.log('[SW] New service worker activated')
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[SW] Registration failed:', error)
    return null
  }
}

// ──────────────────────────────────────────────
// Online Status
// ──────────────────────────────────────────────
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

// ──────────────────────────────────────────────
// IndexedDB helpers for offline queue
// ──────────────────────────────────────────────
function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_QUEUE_DB, 1)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface QueuedRequest {
  id?: number
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  timestamp: number
  meta?: Record<string, unknown>  // Extra metadata (e.g., GRN number for display)
}

/**
 * Queue a request for later replay when back online.
 */
export async function queueOfflineRequest(
  url: string,
  method: string,
  body: string | null,
  headers: Record<string, string> = {},
  meta?: Record<string, unknown>
): Promise<void> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    store.add({
      url,
      method,
      headers,
      body,
      timestamp: Date.now(),
      meta,
    } as QueuedRequest)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Get all pending queued requests.
 */
export async function getOfflineQueue(): Promise<QueuedRequest[]> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Get the count of pending offline requests.
 */
export async function getOfflineQueueCount(): Promise<number> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    const req = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/**
 * Remove a specific request from the queue.
 */
export async function removeFromQueue(id: number): Promise<void> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Clear the entire offline queue.
 */
export async function clearOfflineQueue(): Promise<void> {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    store.clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Trigger the service worker to replay the offline queue.
 * Returns true if the message was sent, false if no SW available.
 */
export async function syncOfflineQueue(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.ready

  // Try Background Sync API first
  if ('sync' in registration) {
    try {
      await (registration as any).sync.register('replay-offline-queue')
      return true
    } catch {
      // Fall through to manual replay
    }
  }

  // Manual replay via message
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'REPLAY_QUEUE' })
    return true
  }

  return false
}
