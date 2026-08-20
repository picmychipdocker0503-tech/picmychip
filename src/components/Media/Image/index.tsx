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
      filename: fullFilename,
      height: fullHeight,
      url,
      width: fullWidth,
    } = resource

    width = widthFromProps ?? fullWidth
    height = heightFromProps ?? fullHeight
    alt = altFromResource

    const filename = fullFilename

    // Use relative URL instead of full URL to avoid Next.js image optimization security issues
    src = url || ''
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
      quality={90}
      sizes={sizes}
      src={hasError || !src ? PRODUCT_IMAGE_PLACEHOLDER : src}
      width={!fill ? width || widthFromProps : undefined}
    />
  )
}
