'use client'

import dynamic from 'next/dynamic'

// All of these render nothing on first paint — CompareBar until the compare
// list is non-empty, InstallPrompt until the browser fires
// `beforeinstallprompt`, GoogleOneTapPrompt until its script has loaded and
// the visitor is confirmed logged out — so every page was shipping their JS
// upfront for a condition that's false on the vast majority of visits.
// `ssr: false` needs a Client Component boundary, which is why this lives in
// its own file rather than inline in the (Server Component) root layout.
export const CompareBar = dynamic(
  () => import('@/components/CompareBar').then((mod) => mod.CompareBar),
  { ssr: false },
)

export const InstallPrompt = dynamic(
  () => import('@/components/InstallPrompt').then((mod) => mod.InstallPrompt),
  { ssr: false },
)

export const GoogleOneTapPrompt = dynamic(
  () => import('@/components/GoogleOneTapPrompt').then((mod) => mod.GoogleOneTapPrompt),
  { ssr: false },
)

export const TawkCartOffsetSync = dynamic(
  () => import('@/components/TawkCartOffsetSync').then((mod) => mod.TawkCartOffsetSync),
  { ssr: false },
)
