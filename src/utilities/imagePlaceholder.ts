const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f4f4f5"/>
  <g stroke="#a1a1aa" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <rect x="120" y="140" width="160" height="120" rx="10"/>
    <path d="M120 230l40-40 30 28 40-48 50 60" />
    <circle cx="160" cy="175" r="12" fill="#a1a1aa" stroke="none"/>
  </g>
  <text x="200" y="292" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#a1a1aa" text-anchor="middle">Image unavailable</text>
</svg>`

/**
 * Inlined as a data URI (not a /public file) so it always renders even if
 * static-asset serving is misconfigured — it's the fallback for exactly
 * that class of failure.
 */
export const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`
