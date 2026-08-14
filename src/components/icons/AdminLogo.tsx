import React from 'react'

import { LogoIcon } from './logo'

const BRAND_GREEN = '#005d1e'

/**
 * Payload admin.components.graphics.Logo — shown on the login screen.
 *
 * Mirrors the "Pic[MY]chip" wordmark treatment used on the storefront
 * (see components/icons/Wordmark) rather than a separate icon-then-name
 * lockup — same brand mark everywhere. Hand-rolled with inline styles
 * instead of reusing Wordmark directly since the admin panel doesn't load
 * the app's Tailwind build.
 */
export const AdminLogo: React.FC = () => (
  <div style={{ alignItems: 'center', display: 'inline-flex', fontSize: '1.5rem', fontWeight: 700, justifyContent: 'center' }}>
    Pic
    <LogoIcon size={32} style={{ color: BRAND_GREEN, margin: '0 0.15em' }} />
    chip
  </div>
)

/** Payload admin.components.graphics.Icon — shown in the collapsed nav bar. */
export const AdminIcon: React.FC = () => <LogoIcon size={28} style={{ color: BRAND_GREEN }} />
