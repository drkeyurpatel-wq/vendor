const CACHE_NAME = 'h1-vpms-v1'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
]

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore cache failures for dynamic pages
      })
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API calls and auth
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Offline</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#EEF2F9;color:#1B3A6B}div{text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#666}</style></head><body><div><h1>You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:#0D7E8A;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem">Retry</button></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          }
          return new Response('', { status: 408 })
        })
      })
  )
})
