const CACHE = 'hogwarts-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    try {
      const fresh = await fetch(event.request)
      if (fresh.ok) await cache.put(event.request, fresh.clone())
      return fresh
    } catch {
      const hit = await cache.match(event.request)
      if (hit) return hit
      if (event.request.mode === 'navigate') {
        const shell = await cache.match('/index.html')
        if (shell) return shell
      }
      throw new Error('offline')
    }
  })())
})
