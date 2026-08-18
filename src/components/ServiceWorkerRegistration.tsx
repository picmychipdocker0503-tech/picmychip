'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    __PWA_RELOADED__?: boolean
  }
}

// How often a long-lived open tab checks for a newer service worker beyond
// the browser's own built-in checks (on navigation / roughly every 24h).
// Deliberately not more aggressive than this — it's a courtesy check for
// tabs left open across a deploy, not a substitute for the browser's own
// update cycle.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

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

    // Fires once a new service worker actually takes control of this page —
    // i.e. after install → skipWaiting → activate → clients.claim() on the
    // new worker. Reloading here (not on 'updatefound'/'installed', which
    // fire earlier and can repeat) picks up the new deploy's HTML/JS/CSS in
    // every open tab. The window flag guards against a second reload if the
    // event ever fires more than once in the same page lifetime.
    const onControllerChange = () => {
      if (window.__PWA_RELOADED__) return
      window.__PWA_RELOADED__ = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    let intervalId: number | undefined

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        intervalId = window.setInterval(() => {
          registration.update().catch(() => {})
        }, UPDATE_CHECK_INTERVAL_MS)
      })
      .catch(() => {
        // PWA is a progressive enhancement — silently no-op if unsupported/blocked.
      })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [])

  return null
}
