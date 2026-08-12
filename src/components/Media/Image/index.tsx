'use client'

import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/cn'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'
import { PRODUCT_IMAGE_PLACEHOLDER } from '@/utilities/imagePlaceholder'

const { breakpoints } = cssVariables

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

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = sizeFromProps
    ? sizeFromProps
    : Object.entries(breakpoints)
        .map(([, value]) => `(max-width: ${value}px) ${value}px`)
        .join(', ')

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
      className={cn(imgClassName)}
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
