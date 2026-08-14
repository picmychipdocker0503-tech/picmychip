import type { ReactNode } from 'react'

/**
 * Deliberately separate root layout from `(app)/layout.tsx` — that one
 * depends on Payload data-fetching for Header/Footer, which would be
 * fragile to serve from a service-worker cache when actually offline.
 * This layout has zero data dependency and inlines its own styles so the
 * offline fallback page renders correctly even if the site's CSS bundle
 * was never cached (e.g. a user's very first visit was offline).
 */
export default function OfflineLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
