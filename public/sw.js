// The version suffix below is substituted at build time
// (scripts/stampServiceWorker.ts, run as part of `pnpm build`) with the
// deployment's commit SHA, so every deploy gets a genuinely new cache name
// — the activate handler further down then deletes every other
// 'Picmychip-static-*' cache, guaranteeing a clean switchover instead of
// accumulating unused entries across deploys. Left as the literal
// placeholder for local dev, where the service worker is never registered
// in the first place — see ServiceWorkerRegistration.tsx.
const CACHE_PREFIX = 'Picmychip-static-'
const CACHE_NAME = `${CACHE_PREFIX}__SW_VERSION__`
const OFFLINE_URL = '/offline'
const STATIC_CACHE_PATTERNS = [/\/_next\/static\//, /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // Only ever touch this app's own caches (this prefix), never any
      // other cache the origin might hold now or in the future — and never
      // the currently-active one.
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// Cache-first for static build assets and images (safe to serve stale, they're
// content-hashed or rarely change); everything else (HTML/API) goes straight
// to the network so pages/data never go stale from the cache. Navigations
// (actual page loads) get one exception: if the network fails outright
// (offline), fall back to the precached offline page instead of the
// browser's default connection-error screen.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL)),
    )
    return
  }

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
