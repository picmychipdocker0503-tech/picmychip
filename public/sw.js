const CACHE_NAME = 'Picmychip-static-v1'
const STATIC_CACHE_PATTERNS = [/\/_next\/static\//, /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/]

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

// Cache-first for static build assets and images (safe to serve stale, they're
// content-hashed or rarely change); everything else (HTML/API) goes straight
// to the network so pages/data never go stale from the cache.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const isStatic = STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))
  if (!isStatic) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached

      try {
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      } catch (err) {
        if (cached) return cached
        throw err
      }
    }),
  )
})
