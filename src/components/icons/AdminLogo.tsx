import React from 'react'

import { brandFont, LogoIcon } from './logo'

/**
 * Payload admin.components.graphics.Logo — shown on the login screen.
 *
 * Mirrors the "PIC [MY] CHIP" wordmark treatment used on the storefront
 * (see components/icons/Wordmark) rather than a separate icon-then-name
 * lockup — same brand mark everywhere. Hand-rolled with inline styles
 * instead of reusing Wordmark directly since the admin panel doesn't load
 * the app's Tailwind build.
 */
export const AdminLogo: React.FC = () => (
  <div
    style={{
      alignItems: 'center',
      display: 'inline-flex',
      fontFamily: brandFont.style.fontFamily,
      fontSize: '20px',
      fontWeight: 800,
      gap: '0.4em',
      justifyContent: 'center',
      textTransform: 'uppercase',
    }}
  >
    Pic
    <LogoIcon size={32} />
    chip
  </div>
)

/** Payload admin.components.graphics.Icon — shown in the collapsed nav bar. */
export const AdminIcon: React.FC = () => <LogoIcon size={28} />
