'use client'

import { useEffect } from 'react'

export const ServiceWorkerRegistration: React.FC = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      // Dev-mode chunk URLs get reused across rebuilds (unlike prod's
      // content-hashed filenames), so a cache-first SW here would serve
      // stale JS forever. Unregister + clear any cache from an earlier
      // session so dev self-heals instead of requiring a manual hard-reload.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
      }
      return
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // PWA is a progressive enhancement — silently no-op if unsupported/blocked.
    })
  }, [])

  return null
}
