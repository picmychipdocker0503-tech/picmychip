import React from 'react'

import { cn } from '@/utilities/cn'

import { aldrich, comicNeue, LogoIcon } from './logo'

type Props = {
  className?: string
  iconClassName?: string
  /** Badge size in px — see LogoIcon. Defaults to roughly one text line-height. */
  iconSize?: number
  name?: string
  /**
   * 'default' (unchanged): Comic Neue, `text-foreground`-driven color — used
   * everywhere this component already appears. 'brand': the reference brand
   * logo's look — bold geometric Russo One face, fixed green "Pic"/"chip"
   * text, and the outline-style "MY" badge (white circle, black text). Only
   * pass this at the specific call sites that should pick up the new look
   * (storefront Header/Footer) — every other usage keeps rendering exactly
   * as before.
   */
  variant?: 'default' | 'brand'
}

// Fixed to match the reference brand logo's green — not tied to the
// theme-able `--primary` token, since that token shifts per selected site
// theme and this mark is meant to render as one fixed brand color.
const BRAND_GREEN = '#22C55E'

const WORDMARK_STYLE: React.CSSProperties = {
  fontFamily: comicNeue.style.fontFamily,
  fontSize: '18px',
  textTransform: 'uppercase',
}

const BRAND_WORDMARK_STYLE: React.CSSProperties = {
  color: BRAND_GREEN,
  fontFamily: aldrich.style.fontFamily,
  fontSize: '18px',
  textTransform: 'uppercase',
}

/**
 * Renders the site name with the circular "MY" mark standing in for the
 * literal "my" inside "Picmychip" — Pic[MY]chip — instead of sitting as a
 * separate icon before the word. Falls back to icon-then-name if the given
 * name doesn't contain "my" (e.g. a differently configured SITE_NAME).
 *
 * Typography (uppercase, 18px, Comic Neue by default) is fixed here rather
 * than left to each call site's className, so every usage across the site —
 * storefront header/footer, admin login — renders the same wordmark
 * consistently, unless a call site opts into `variant="brand"`.
 */
export function Wordmark({ className, iconClassName, iconSize = 20, name = 'Picmychip', variant = 'default' }: Props) {
  const isBrand = variant === 'brand'
  const style = isBrand ? BRAND_WORDMARK_STYLE : WORDMARK_STYLE
  const iconVariant = isBrand ? ('outline' as const) : ('filled' as const)

  const match = name.match(/my/i)

  if (!match || match.index === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-2.5', className)} style={style}>
        <LogoIcon className={iconClassName} size={iconSize} variant={iconVariant} />
        {name}
      </span>
    )
  }

  const before = name.slice(0, match.index)
  const after = name.slice(match.index + match[0].length)

  return (
    <span className={cn('inline-flex items-center', className)} style={style}>
      {before}
      <LogoIcon className={cn('mx-0.5', iconClassName)} size={iconSize} variant={iconVariant} />
      {after}
    </span>
  )
}
