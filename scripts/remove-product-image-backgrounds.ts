// Batch-removes the solid black/white studio backgrounds baked into product
// photos. Despite most filenames ending in "-transparent.png", none of them
// actually have a transparent background — they were converted to PNG at
// some point but background removal was never actually run.
//
// Approach: flood-fill from the image border, removing only background
// pixels connected to the edge (auto-detected from the four corner colors).
// This is safe for products with black/white parts of their own (a black
// connector housing, a white plastic body) because those pixels aren't
// connected to the border — verified against a black-on-black connector
// photo before running this at scale. A soft feather band anti-aliases the
// cutout edge instead of leaving a hard/jagged line.
//
// This reads originals straight from the public R2 URL (no credentials
// needed) and writes everything to local disk — it does NOT touch R2 or the
// Payload media docs. R2 API credentials in .env turned out to be unusable
// for this bucket (every S3 API call, including plain reads, failed —
// possibly the "Picmychip-media" bucket name itself, since S3-style bucket
// names must be lowercase). Getting the processed images live still needs a
// separate step once R2 write access is sorted: either re-upload each file
// in scripts/output/processed/<filename> through the admin UI, or fix the
// credentials and extend this script to call payload.update() with the
// processed buffer as the new `file`.
//
// Usage:
//   pnpm tsx scripts/remove-product-image-backgrounds.ts --dry-run   # no writes, just logs what would happen
//   pnpm tsx scripts/remove-product-image-backgrounds.ts --limit=10  # process only the first 10
//   pnpm tsx scripts/remove-product-image-backgrounds.ts             # process everything
//
// Output:
//   scripts/output/originals/<filename>   — untouched copy of each source image
//   scripts/output/processed/<filename>   — background-removed version
//   scripts/output/manifest.json          — media id / product title / filename for cross-reference
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? Infinity)

const OUTPUT_DIR = path.resolve(dirname, 'output')
const ORIGINALS_DIR = path.join(OUTPUT_DIR, 'originals')
const PROCESSED_DIR = path.join(OUTPUT_DIR, 'processed')

async function removeBackground(
  inputBuffer: Buffer,
  { tolerance = 28, featherBand = 40 } = {},
): Promise<Buffer> {
  const image = sharp(inputBuffer).ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const idx = (x: number, y: number) => (y * width + x) * channels

  const corners: [number, number][] = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]
  let br = 0
  let bg = 0
  let bb = 0
  for (const [x, y] of corners) {
    const i = idx(x, y)
    br += data[i]
    bg += data[i + 1]
    bb += data[i + 2]
  }
  br /= 4
  bg /= 4
  bb /= 4

  const dist = (i: number) => {
    const dr = data[i] - br
    const dg = data[i + 1] - bg
    const db = data[i + 2] - bb
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  const visited = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let qHead = 0
  let qTail = 0

  const tryPush = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    const i = idx(x, y)
    if (dist(i) > tolerance + featherBand) return
    visited[p] = 1
    queue[qTail++] = p
  }

  for (let x = 0; x < width; x++) {
    tryPush(x, 0)
    tryPush(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    tryPush(0, y)
    tryPush(width - 1, y)
  }

  while (qHead < qTail) {
    const p = queue[qHead++]
    const x = p % width
    const y = (p / width) | 0
    const i = idx(x, y)

    const d = dist(i)
    if (d <= tolerance) {
      data[i + 3] = 0
    } else {
      const t = (d - tolerance) / featherBand
      data[i + 3] = Math.round(255 * Math.min(1, t))
    }

    tryPush(x + 1, y)
    tryPush(x - 1, y)
    tryPush(x, y + 1)
    tryPush(x, y - 1)
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer()
}

async function run() {
  const payload = await getPayload({ config })

  const products = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 500,
    where: { isGiftCard: { not_equals: true } },
  })

  const mediaMap = new Map<number | string, any>()
  const titleByMediaId = new Map<number | string, string>()
  for (const p of products.docs) {
    for (const g of p.gallery ?? []) {
      if (typeof g.image === 'object' && g.image) {
        mediaMap.set(g.image.id, g.image)
        if (!titleByMediaId.has(g.image.id)) titleByMediaId.set(g.image.id, p.title)
      }
    }
  }

  console.log(`Found ${mediaMap.size} unique product images. Dry run: ${DRY_RUN}. Limit: ${LIMIT}`)

  if (!DRY_RUN) {
    await fs.mkdir(ORIGINALS_DIR, { recursive: true })
    await fs.mkdir(PROCESSED_DIR, { recursive: true })
  }

  let processed = 0
  let skipped = 0
  let failed = 0
  const manifest: Array<{
    mediaId: number | string
    productTitle: string
    filename: string
    originalBytes: number
    processedBytes: number
  }> = []

  for (const media of mediaMap.values()) {
    if (processed + skipped + failed >= LIMIT) break

    try {
      if (!media.url || !media.mimeType || media.mimeType === 'image/svg+xml') {
        skipped++
        continue
      }

      const res = await fetch(media.url)
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
      const original = Buffer.from(await res.arrayBuffer())

      const outBuffer = await removeBackground(original)

      if (!DRY_RUN) {
        await fs.writeFile(path.join(ORIGINALS_DIR, media.filename), original)
        await fs.writeFile(path.join(PROCESSED_DIR, media.filename), outBuffer)
        manifest.push({
          filename: media.filename,
          mediaId: media.id,
          originalBytes: original.length,
          processedBytes: outBuffer.length,
          productTitle: titleByMediaId.get(media.id) ?? '',
        })
      }

      processed++
      console.log(
        `[${processed}] ${DRY_RUN ? '(dry) ' : ''}ok: ${media.filename} (${original.length}b -> ${outBuffer.length}b)`,
      )
    } catch (err) {
      failed++
      console.error(`FAILED: ${media.filename ?? media.id} — ${(err as Error).message}`)
    }
  }

  if (!DRY_RUN && manifest.length > 0) {
    await fs.writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  }

  console.log('SUMMARY', { failed, processed, skipped, total: mediaMap.size })
  if (!DRY_RUN) console.log(`Output written to ${OUTPUT_DIR}`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
