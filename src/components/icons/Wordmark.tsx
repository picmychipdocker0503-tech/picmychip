import React from 'react'

import { cn } from '@/utilities/cn'

import { comicNeue, LogoIcon } from './logo'

type Props = {
  className?: string
  iconClassName?: string
  /** Badge size in px — see LogoIcon. Defaults to roughly one text line-height. */
  iconSize?: number
  name?: string
}

const WORDMARK_STYLE: React.CSSProperties = {
  fontFamily: comicNeue.style.fontFamily,
  fontSize: '18px',
  textTransform: 'uppercase',
}

/**
 * Renders the site name with the circular "MY" mark standing in for the
 * literal "my" inside "Picmychip" — Pic[MY]chip — instead of sitting as a
 * separate icon before the word. Falls back to icon-then-name if the given
 * name doesn't contain "my" (e.g. a differently configured SITE_NAME).
 *
 * Typography (uppercase, 18px, Comic Neue) is fixed here rather than left to
 * each call site's className, so every usage across the site — storefront
 * header/footer, admin login — renders the same wordmark consistently.
 */
export function Wordmark({ className, iconClassName, iconSize = 20, name = 'Picmychip' }: Props) {
  const match = name.match(/my/i)

  if (!match || match.index === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-2.5', className)} style={WORDMARK_STYLE}>
        <LogoIcon className={iconClassName} size={iconSize} />
        {name}
      </span>
    )
  }

  const before = name.slice(0, match.index)
  const after = name.slice(match.index + match[0].length)

  return (
    <span className={cn('inline-flex items-center', className)} style={WORDMARK_STYLE}>
      {before}
      <LogoIcon className={cn('mx-0.5', iconClassName)} size={iconSize} />
      {after}
    </span>
  )
}
