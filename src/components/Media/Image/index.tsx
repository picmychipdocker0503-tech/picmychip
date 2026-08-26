'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/cn'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { PRODUCT_IMAGE_PLACEHOLDER } from '@/utilities/imagePlaceholder'

export const Image: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    height: heightFromProps,
    imgClassName,
    onClick,
    onLoad: onLoadFromProps,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    width: widthFromProps,
  } = props

  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  let width: number | undefined | null
  let height: number | undefined | null
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''

  if (!src && resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      height: fullHeight,
      updatedAt,
      url,
      width: fullWidth,
    } = resource

    width = widthFromProps ?? fullWidth
    height = heightFromProps ?? fullHeight
    alt = altFromResource

    // Use relative URL instead of full URL to avoid Next.js image optimization security issues
    // The Media doc's filename isn't content-hashed (see next.config.ts's
    // images.minimumCacheTTL comment) — replacing a product photo reuses the
    // exact same URL, so a long CDN/Image-Optimization cache TTL would keep
    // serving the old bytes indefinitely. Appending `updatedAt` as a cache
    // key makes the URL itself change on every edit, so correctness comes
    // from that instead of a short TTL — freeing minimumCacheTTL to be long
    // (fewer repeat "transformations" billed) without ever going stale.
    src = url ? `${url}${url.includes('?') ? '&' : '?'}v=${new Date(updatedAt).getTime()}` : ''
  }

  // NOTE: this is used by the browser to determine which image to download at different screen
  // sizes. Callers that render at less than full viewport width (grid thumbnails, avatars, etc.)
  // should pass an explicit `size` — this fallback assumes full-bleed, which is always at least
  // as accurate as the previous default (which mapped breakpoint *pixel constants* directly, so
  // a narrow phone viewport still requested a 768px-wide image).
  const sizes = sizeFromProps || '100vw'

  // Reset the fallback whenever the underlying image changes (e.g. switching
  // product variants) — a previous failure shouldn't stick to a new image.
  const lastSrcRef = React.useRef(src)
  if (lastSrcRef.current !== src) {
    lastSrcRef.current = src
    if (hasError) setHasError(false)
  }

  return (
    <NextImage
      alt={hasError || !src ? 'Image unavailable' : alt || ''}
      // `next/image` already defers the actual fetch until the image nears the
      // viewport (native lazy loading, on by default whenever `priority` isn't
      // set) — the shimmer here just fills that same window with a visible
      // placeholder instead of blank space, both before it's scrolled close
      // enough to start loading and while the request itself is in flight.
      className={cn(imgClassName, isLoading && !hasError && 'animate-shimmer')}
      fill={fill}
      height={!fill ? height || heightFromProps : undefined}
      onClick={onClick}
      onError={() => setHasError(true)}
      onLoad={() => {
        setIsLoading(false)
        if (typeof onLoadFromProps === 'function') {
          onLoadFromProps()
        }
      }}
      priority={priority}
      // `priority` alone (this version's deprecated-but-still-functional prop)
      // correctly suppresses lazy-loading and emits a <link rel="preload">, but
      // no longer sets fetchpriority="high" on the <img> itself the way it used
      // to — that's apparently opt-in now via this separate prop.
      fetchPriority={priority ? 'high' : undefined}
      quality={90}
      sizes={sizes}
      src={hasError || !src ? PRODUCT_IMAGE_PLACEHOLDER : src}
      width={!fill ? width || widthFromProps : undefined}
    />
  )
}
