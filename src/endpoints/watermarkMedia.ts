import type { Endpoint, PayloadRequest } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const TILE_SIZE = 180 // spacing between repeats
const ICON_SIZE = 46 // rendered icon size within each tile — small relative to TILE_SIZE so most of the tile is empty space
const ROTATION_DEGREES = -35 // within the requested -30° to -45° range
const OPACITY = 0.2 // the favicon is a solid-filled shape (denser per-pixel than thin text), kept at the low end of the requested 20%-25% range
const BAND_HEIGHT_RATIO = 0.22 // watermark confined to this fraction of the image height, anchored to the bottom — not the full photo

// Read once at module load and reused for every request — the favicon
// itself never changes at runtime, no reason to hit disk per watermark.
const faviconBase64 = fs.readFileSync(path.resolve(process.cwd(), 'public/icons/icon-512.png')).toString('base64')

/**
 * A single SVG <pattern>, sized to the source image, tiling the rotated
 * favicon icon — patternTransform handles the rotation so every tile repeats
 * at the same angle without needing to pre-rotate and re-tile a raster
 * texture. Only drawn within a band at the bottom of the image (not the
 * full canvas) — patternUnits="userSpaceOnUse" anchors the tiling to
 * absolute SVG coordinates, so confining the <rect> that paints it to just
 * the bottom band simply crops which part of that same infinite pattern
 * shows, with no change needed to the pattern definition itself.
 */
function buildWatermarkSvg(width: number, height: number): string {
  const bandHeight = height * BAND_HEIGHT_RATIO
  const bandY = height - bandHeight
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="wm" width="${TILE_SIZE}" height="${TILE_SIZE}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ROTATION_DEGREES})">
      <image href="data:image/png;base64,${faviconBase64}" x="${(TILE_SIZE - ICON_SIZE) / 2}" y="${(TILE_SIZE - ICON_SIZE) / 2}" width="${ICON_SIZE}" height="${ICON_SIZE}" opacity="${OPACITY}" />
    </pattern>
  </defs>
  <rect x="0" y="${bandY}" width="100%" height="${bandHeight}" fill="url(#wm)" />
</svg>`.trim()
}

/**
 * GET /api/media/watermark/:id — composites the repeating diagonal favicon
 * watermark over a media doc's original file on demand (never
 * pre-generated/stored), for copy and download actions only. Normal
 * browsing and zoom always use the clean original URL directly — this
 * endpoint is never in the hot path for viewing a product image.
 */
export const watermarkMediaEndpoint: Endpoint = {
  handler: async (req: PayloadRequest): Promise<Response> => {
    const id = req.routeParams?.id
    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Missing media id.' }, { status: 400 })
    }

    try {
      const media = await req.payload.findByID({
        collection: 'media',
        id,
        depth: 0,
        overrideAccess: true,
      })

      if (!media?.url) {
        return Response.json({ error: 'Media not found.' }, { status: 404 })
      }

      // Media uploaded before R2 storage was enabled kept a relative
      // `/api/media/file/...` URL rather than an absolute R2 one — `fetch`
      // can't resolve a relative path on its own.
      const sourceUrl = /^https?:\/\//i.test(media.url) ? media.url : `${getServerSideURL()}${media.url}`
      const sourceRes = await fetch(sourceUrl)
      if (!sourceRes.ok) {
        throw new Error(`Failed to fetch source image: ${sourceRes.status}`)
      }
      const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer())

      const image = sharp(sourceBuffer)
      const metadata = await image.metadata()
      const width = metadata.width || media.width || 1200
      const height = metadata.height || media.height || 1200

      const watermarked = await image
        // ensureAlpha keeps transparent PNG cutouts transparent — compositing
        // an opaque-background result over them would otherwise fill in the
        // cutout with white/black depending on the source format.
        .ensureAlpha()
        .composite([{ input: Buffer.from(buildWatermarkSvg(width, height)), top: 0, left: 0 }])
        .png()
        .toBuffer()

      const url = new URL(req.url || '', 'http://localhost')
      const isDownload = url.searchParams.get('download') === 'true'

      const headers = new Headers({
        'Cache-Control': 'private, max-age=0, no-store',
        'Content-Type': 'image/png',
      })
      if (isDownload) {
        const originalFilename = media.filename || `${id}.png`
        const baseName = originalFilename.replace(/\.[^./]+$/, '')
        headers.set('Content-Disposition', `attachment; filename="PICMYCHIP-${baseName}.png"`)
      }

      return new Response(watermarked, { headers, status: 200 })
    } catch (err) {
      req.payload.logger.error({ err, mediaId: id, msg: 'Failed to generate watermarked image' })
      return Response.json({ error: 'Could not generate watermarked image.' }, { status: 500 })
    }
  },
  method: 'get',
  // Collection-scoped (registered on Media.ts's own `endpoints`), so this
  // resolves to /api/media/watermark/:id — a root-level endpoint at that
  // same path collided with the media collection's own generated REST
  // routes and 404'd.
  path: '/watermark/:id',
}
