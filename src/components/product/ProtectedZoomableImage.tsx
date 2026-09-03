'use client'

import { cn } from '@/utilities/cn'
import { getClientSideURL } from '@/utilities/getURL'
import { DownloadIcon, ZoomInIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  /** Payload media doc id — used to build the on-demand watermark endpoint URL. */
  mediaId: string | number
  /** Clean, un-watermarked image URL — used for normal browsing and zoom. */
  src: string
  alt: string
  className?: string
  /** Zoom scale while toggled on, 2x–2.5x per spec. */
  zoomScale?: number
  sizes?: string
  showDownloadButton?: boolean
}

const watermarkUrl = (mediaId: string | number, download: boolean) =>
  `${getClientSideURL()}/api/media/watermark/${mediaId}${download ? '?download=true' : ''}`

/**
 * Clean image for browsing/zoom, watermarked image only for copy/download.
 *
 * Zoom is click-to-toggle (not hover-to-zoom) and scoped entirely inside the
 * `overflow-hidden` container via CSS transform — the container's own box
 * never changes size, so scaling the image never reflows surrounding layout.
 * transform-origin tracks the cursor while zoomed so the magnified area pans
 * to wherever the pointer is, snapping instantly (no transition) so panning
 * feels direct; only the scale change on zoom toggle animates.
 *
 * Copy/save protection is best-effort, not real DRM (nothing in a browser
 * can be): disabling the context menu blocks the "Copy image" / "Save
 * image" menu items from ever appearing, which is the actual protection for
 * right-click actions — those don't dispatch a page-level `copy` DOM event
 * at all, so intercepting `onCopy` can't catch them. `onCopy` here instead
 * catches Ctrl+C when the image happens to be part of a text selection,
 * swapping the clipboard payload for the watermarked version. The explicit
 * "Download Image" button is the one deliberate, always-watermarked way to
 * actually get a copy of the image.
 */
export function ProtectedZoomableImage({
  mediaId,
  src,
  alt,
  className,
  zoomScale = 2.2,
  sizes = '(max-width: 1024px) 100vw, 50vw',
  showDownloadButton = true,
}: Props) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const updateOriginFromEvent = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setOrigin({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) })
  }, [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    setIsZoomed((prev) => {
      const next = !prev
      if (next) updateOriginFromEvent(event)
      return next
    })
  }, [updateOriginFromEvent])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed) return
      updateOriginFromEvent(event)
    },
    [isZoomed, updateOriginFromEvent],
  )

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false)
  }, [])

  const handleCopy = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault()
      try {
        const res = await fetch(watermarkUrl(mediaId, false))
        if (!res.ok) throw new Error('Failed to fetch watermarked image')
        const blob = await res.blob()
        await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })])
        toast.success('Watermarked image copied to clipboard.')
      } catch {
        toast.error('Could not copy image — please try the download button instead.')
      }
    },
    [mediaId],
  )

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(watermarkUrl(mediaId, true))
      if (!res.ok) throw new Error('Failed to fetch watermarked image')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `PICMYCHIP-${mediaId}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Could not download image — please try again.')
    } finally {
      setIsDownloading(false)
    }
  }, [mediaId])

  return (
    <div className="flex flex-col gap-3">
      <div
        aria-label={isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
        className={cn(
          'border-border bg-background relative aspect-square w-full overflow-hidden rounded-2xl border select-none',
          isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in',
          className,
        )}
        onClick={handleClick}
        onContextMenu={(event) => event.preventDefault()}
        onCopy={handleCopy}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        ref={containerRef}
        role="button"
        tabIndex={0}
      >
        <Image
          alt={alt}
          className="object-contain p-6"
          draggable={false}
          fill
          sizes={sizes}
          src={src}
          style={{
            transform: `scale(${isZoomed ? zoomScale : 1})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transition: 'transform 200ms ease-out',
          }}
        />
        {!isZoomed && (
          <span className="bg-background/90 text-foreground pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm">
            <ZoomInIcon className="size-3.5" />
            Zoom
          </span>
        )}
      </div>

      {showDownloadButton && (
        <button
          className="border-border text-foreground hover:border-primary/40 hover:text-primary inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          disabled={isDownloading}
          onClick={handleDownload}
          type="button"
        >
          <DownloadIcon className="size-3.5" />
          {isDownloading ? 'Preparing…' : 'Download Image'}
        </button>
      )}
    </div>
  )
}
