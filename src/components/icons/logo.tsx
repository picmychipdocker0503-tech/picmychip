import { Comic_Neue } from 'next/font/google'
import React from 'react'

import { cn } from '@/utilities/cn'

// Comic Sans MS itself is a proprietary system font and can't be embedded as
// a webfont — Comic Neue is the freely-licensed redesign built for this.
// Bold (700) keeps the "MY" badge legible at the small sizes it's used at —
// the Light weight it used to ship with all but disappeared below ~28px.
const comicNeue = Comic_Neue({ subsets: ['latin'], weight: ['700'] })

type Props = React.ComponentProps<'svg'> & {
  /**
   * Renders at this size (px) via inline style so it's never at the mercy of
   * conflicting Tailwind width/height classes — and so it still sizes
   * correctly inside the Payload admin panel, which doesn't load the app's
   * Tailwind build at all.
   */
  size?: number
}

export function LogoIcon({ size = 16, style, ...props }: Props) {
  return (
    <svg
      aria-label="Picmychip logo"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      className={cn('shrink-0', props.className)}
      style={{ height: size, width: size, ...style }}
    >
      <circle cx="16" cy="16" r="14" fill="currentColor" />
      <text
        x="16"
        y="20.8"
        textAnchor="middle"
        style={{ fontFamily: comicNeue.style.fontFamily }}
        fontWeight="700"
        fontSize="13.5"
        letterSpacing="-0.2"
        fill="white"
      >
        MY
      </text>
    </svg>
  )
}
