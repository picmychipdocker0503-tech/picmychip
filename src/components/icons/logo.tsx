import { Aldrich, Comic_Neue } from 'next/font/google'
import React from 'react'

import { cn } from '@/utilities/cn'

// Comic Sans MS itself is a proprietary system font and can't be embedded as
// a webfont — Comic Neue is the freely-licensed redesign built for this.
// Bold (700) keeps the "MY" badge legible at the small sizes it's used at —
// the Light weight it used to ship with all but disappeared below ~28px.
// Exported so Wordmark (and anything else rendering the "Pic"/"chip" text
// around this mark) can reuse the exact same font-family instead of loading
// Comic Neue a second time under a different Next font-optimization handle.
export const comicNeue = Comic_Neue({ subsets: ['latin'], weight: ['700'] })

// Squared, geometric "tech" face used for the brand-variant wordmark (see
// Wordmark's `variant="brand"`) — the reference logo's flat-cut "C" and
// angular "P" match a Bank Gothic-style face; Aldrich is the closest
// legitimately-licensed Google Font to that look (Bank Gothic itself is a
// proprietary commercial font, not redistributable as a webfont here).
export const aldrich = Aldrich({ subsets: ['latin'], weight: '400' })

type Props = React.ComponentProps<'svg'> & {
  /**
   * Renders at this size (px) via inline style so it's never at the mercy of
   * conflicting Tailwind width/height classes — and so it still sizes
   * correctly inside the Payload admin panel, which doesn't load the app's
   * Tailwind build at all.
   */
  size?: number
  /**
   * 'filled' (default): solid `currentColor` circle with white text — the
   * original mark, unchanged everywhere it's already used (admin login, the
   * default Wordmark). 'outline': white circle with a black stroke and black
   * text, matching the reference brand logo's badge — only used by
   * Wordmark's `variant="brand"`.
   */
  variant?: 'filled' | 'outline'
}

export function LogoIcon({ size = 16, style, variant = 'filled', ...props }: Props) {
  const isOutline = variant === 'outline'

  return (
    <svg
      aria-label="Picmychip logo"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn('shrink-0', props.className)}
      style={{ height: size, width: size, ...style }}
    >
      <circle
        cx="16"
        cy="16"
        r={isOutline ? 13 : 14}
        fill={isOutline ? 'white' : 'currentColor'}
        stroke={isOutline ? 'black' : undefined}
        strokeWidth={isOutline ? 2 : undefined}
      />
      <text
        x="16"
        y="20.8"
        textAnchor="middle"
        style={{ fontFamily: comicNeue.style.fontFamily }}
        fontWeight="700"
        fontSize="13.5"
        letterSpacing="-0.2"
        fill={isOutline ? 'black' : 'white'}
      >
        MY
      </text>
    </svg>
  )
}
