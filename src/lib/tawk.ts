declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void
      hideWidget?: () => void
      showWidget?: () => void
      onLoad?: () => void
    }
  }
}

/** Opens the Tawk.to widget — the script itself is loaded once, site-wide, in the root layout. */
export function showTawkChat() {
  if (typeof window === 'undefined') return
  window.Tawk_API?.maximize?.()
}

export {}
