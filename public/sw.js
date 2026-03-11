const CACHE_VERSION = 'h1-vpms-v2'
const STATIC_CACHE = CACHE_VERSION + '-static'
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic'
const OFFLINE_QUEUE_DB = 'h1-vpms-offline-queue'
const OFFLINE_QUEUE_STORE = 'requests'

const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/offline.html',
]

// Static asset extensions for cache-first strategy
const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf']

// ──────────────────────────────────────────────
// IndexedDB helpers for offline queue
// ──────────────────────────────────────────────
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_QUEUE_DB, 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function enqueueRequest(url, method, headers, body) {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    store.add({
      url,
      method,
      headers: Object.fromEntries(headers.entries ? headers.entries() : []),
      body,
      timestamp: Date.now(),
    })
    tx.oncomplete = () => {
      resolve()
      // Notify all clients about new queued item
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'OFFLINE_QUEUE_UPDATED' })
        })
      })
    }
    tx.onerror = () => reject(tx.error)
  })
}

async function getQueuedRequests() {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function removeQueuedRequest(id) {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getQueueCount() {
  const db = await openQueueDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly')
    const store = tx.objectStore(OFFLINE_QUEUE_STORE)
    const req = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ──────────────────────────────────────────────
// Replay offline queue
// ──────────────────────────────────────────────
async function replayQueue() {
  const requests = await getQueuedRequests()
  if (requests.length === 0) return

  // Sort by timestamp to replay in order
  requests.sort((a, b) => a.timestamp - b.timestamp)

  for (const item of requests) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      })

      if (response.ok || response.status < 500) {
        // Remove from queue on success or client error (don't retry 4xx)
        await removeQueuedRequest(item.id)
      } else {
        // Server error — stop replaying, will retry later
        break
      }
    } catch {
      // Network still down — stop replaying
      break
    }
  }

  // Notify clients about queue update
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'OFFLINE_QUEUE_UPDATED' })
    client.postMessage({ type: 'SYNC_COMPLETE' })
  })
}

// ──────────────────────────────────────────────
// Install — cache static assets + offline page
// ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore cache failures for dynamic pages
      })
    })
  )
  self.skipWaiting()
})

// ──────────────────────────────────────────────
// Activate — clean old caches
// ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ──────────────────────────────────────────────
// Fetch handler
// ──────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests (Supabase, analytics, etc.)
  if (url.origin !== self.location.origin) return

  // ── Handle POST/PUT/PATCH requests (offline queue) ──
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          // Network failed — queue the request
          const body = await request.text()
          const headers = {}
          for (const [key, value] of request.headers.entries()) {
            if (key.toLowerCase() !== 'content-length') {
              headers[key] = value
            }
          }
          await enqueueRequest(url.href, request.method, new Headers(headers), body)

          // Return a synthetic response so the app knows it was queued
          return new Response(
            JSON.stringify({
              offline: true,
              message: 'Request queued for sync when back online',
              queued_at: new Date().toISOString(),
            }),
            {
              status: 202,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        })
      )
    }
    return
  }

  // ── Skip auth-related GETs ──
  if (url.pathname.startsWith('/auth/')) return

  // ── Cache-first for static assets ──
  const isStaticAsset = STATIC_EXTENSIONS.some(ext => url.pathname.endsWith(ext))
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        }).catch(() => new Response('', { status: 408 }))
      })
    )
    return
  }

  // ── Network-first for API GET requests ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          return new Response(
            JSON.stringify({ error: 'Offline', offline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        })
      })
    )
    return
  }

  // ── Network-first for HTML pages ──
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') {
        const clone = response.clone()
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone))
      }
      return response
    }).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
        return new Response('', { status: 408 })
      })
    })
  )
})

// ──────────────────────────────────────────────
// Message handler — sync queue on demand
// ──────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REPLAY_QUEUE') {
    event.waitUntil(replayQueue())
  }
  if (event.data && event.data.type === 'GET_QUEUE_COUNT') {
    getQueueCount().then(count => {
      event.source.postMessage({ type: 'QUEUE_COUNT', count })
    })
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ──────────────────────────────────────────────
// Background sync (if supported)
// ──────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'replay-offline-queue') {
    event.waitUntil(replayQueue())
  }
})
