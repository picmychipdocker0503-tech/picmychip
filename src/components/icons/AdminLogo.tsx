import React from 'react'

import { LogoIcon } from './logo'

const BRAND_PURPLE = '#6a00c5'

/** Payload admin.components.graphics.Logo — shown on the login screen. */
export const AdminLogo: React.FC = () => (
  <div style={{ alignItems: 'center', display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
    <LogoIcon style={{ color: BRAND_PURPLE, height: '2.5rem', width: '2.5rem' }} />
    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Picmychip</span>
  </div>
)

/** Payload admin.components.graphics.Icon — shown in the collapsed nav bar. */
export const AdminIcon: React.FC = () => <LogoIcon style={{ color: BRAND_PURPLE, height: '1.75rem', width: '1.75rem' }} />
