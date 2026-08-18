import React from 'react'

import { cn } from '@/utilities/cn'

/**
 * Storefront reuse of the icon set drawn for the Payload admin sidebar
 * (public/admin-icons/*.svg — settings, package, map-pin, log-out) as proper
 * React components instead of the admin's CSS mask-image technique, so they
 * take currentColor and work like any other icon in JSX. Same path data,
 * just inlined here rather than fetched as a file — a storefront page render
 * shouldn't take an extra asset request for a handful of small icons.
 */
type IconProps = React.ComponentProps<'svg'>

const base = (props: IconProps) => ({
  fill: 'none',
  height: '1em',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 2,
  viewBox: '0 0 24 24',
  width: '1em',
  xmlns: 'http://www.w3.org/2000/svg',
  ...props,
  className: cn('shrink-0', props.className),
})

/** "Account settings" — matches the admin's Site Settings nav icon. */
export const SlidersIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
)

/** "Orders" — matches the admin's Orders collection nav icon. */
export const PackageIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M21 16V8A2 2 0 0020 6.29L13 2.29A2 2 0 0011 2.29L4 6.29A2 2 0 003 8V16A2 2 0 004 17.71L11 21.71A2 2 0 0013 21.71L20 17.71A2 2 0 0021 16Z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

/** "Addresses" — new to the set (no admin nav item needed it), same drawing convention. */
export const MapPinIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0121 10Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

/** "Log out" — new to the set, same drawing convention. */
export const LogOutIcon: React.FC<IconProps> = (props) => (
  <svg {...base(props)}>
    <path d="M9 21H5A2 2 0 013 19V5A2 2 0 015 3H9" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
