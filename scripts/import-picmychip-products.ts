import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'
import config from '../src/payload.config'
import { CATEGORY_HSN, FALLBACK_HSN } from './hsnCategoryMap'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type ManifestItem = {
  productId: string
  variantId: string
  title: string
  slug: string
  categoryRaw: string
  category: string
  brand: string | null
  priceInUSD: number
  inventory: number
  descriptionParagraphs: string[]
  pageUrl: string
}

type FetchResult =
  | { productId: string; status: 'ok'; imageUrl: string; localPath: string; contentType: string; bytes: number }
  | { productId: string; status: 'no-image-tag' | 'error'; error?: string }

const SCRATCH_DIR = path.join(dirname, 'data', 'Picmychip-import')

const textNode = (text: string) => ({ type: 'text', text, version: 1 })

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.length > 0 ? paragraphs.map(paragraph) : [paragraph('')],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const mimeFromExt = (ext: string): string => {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    default:
      return 'image/webp'
  }
}

async function main() {
  const manifest: ManifestItem[] = JSON.parse(
    fs.readFileSync(path.join(SCRATCH_DIR, 'manifest.json'), 'utf-8'),
  )
  const fetchResults: FetchResult[] = JSON.parse(
    fs.readFileSync(path.join(SCRATCH_DIR, 'fetch_results.json'), 'utf-8'),
  )
  const fetchByProductId = new Map(fetchResults.map((r) => [r.productId, r]))

  const payload = await getPayload({ config })
  payload.logger.info(`Starting import of ${manifest.length} products...`)

  // ---------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------
  const canonicalCategories = [...new Set(manifest.map((item) => item.category))].sort()
  const categoryIdByName = new Map<string, number>()

  for (const name of canonicalCategories) {
    const existing = await payload.find({
      collection: 'categories',
      where: { title: { equals: name } },
      limit: 1,
    })
    if (existing.docs[0]) {
      categoryIdByName.set(name, existing.docs[0].id)
      continue
    }
    const created = await payload.create({
      collection: 'categories',
      data: { title: name, slug: slugify(name), specSchemaType: 'none' },
    })
    categoryIdByName.set(name, created.id)
  }
  payload.logger.info(`— ${categoryIdByName.size} categories ready`)

  // ---------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------
  let created = 0
  let skippedExisting = 0
  let skippedNoImage = 0
  let failed = 0
  const failures: { productId: string; title: string; reason: string }[] = []

  for (const item of manifest) {
    try {
      const existing = await payload.find({
        collection: 'products',
        where: { title: { equals: item.title } },
        limit: 1,
      })
      if (existing.docs[0]) {
        skippedExisting++
        continue
      }

      const fetchResult = fetchByProductId.get(item.productId)
      if (!fetchResult || fetchResult.status !== 'ok') {
        skippedNoImage++
        failures.push({
          productId: item.productId,
          title: item.title,
          reason: fetchResult ? `image fetch: ${fetchResult.status}` : 'no fetch result',
        })
        continue
      }

      const imagePath = path.join(SCRATCH_DIR, fetchResult.localPath)
      const imageBuffer = fs.readFileSync(imagePath)
      const ext = path.extname(fetchResult.localPath)

      const media = await payload.create({
        collection: 'media',
        data: { alt: item.title },
        file: {
          name: `${item.slug}${ext}`,
          data: imageBuffer,
          mimetype: mimeFromExt(ext),
          size: imageBuffer.length,
        },
      })

      const categoryId = categoryIdByName.get(item.category)
      // Best-effort by category, same mapping as scripts/backfill-hsn-codes.ts — worth a
      // spot-check for newly imported categories not yet in that map (falls back to a generic
      // catch-all code rather than leaving the required field empty).
      const hsnCode = CATEGORY_HSN[item.category] ?? FALLBACK_HSN

      await payload.create({
        collection: 'products',
        depth: 0,
        data: {
          title: item.title,
          slug: item.slug,
          _status: 'published',
          description: richText(item.descriptionParagraphs),
          gallery: [{ image: media.id }],
          categories: categoryId ? [categoryId] : [],
          specSchemaType: 'none',
          hsnCode,
          // Manifest values are historically USD-denominated minor units — the store is now
          // INR-only, so new imports use the same x100 reinterpretation applied to the rest of
          // the catalog (see the 2026-08-10 INR backfill) rather than the old ~83x FX rate.
          priceInINR: item.priceInUSD * 100,
          inventory: Math.max(0, item.inventory),
        },
      })
      created++

      if ((created + skippedExisting + skippedNoImage + failed) % 25 === 0) {
        payload.logger.info(
          `— progress: ${created} created, ${skippedExisting} already existed, ${skippedNoImage} skipped (no image), ${failed} failed`,
        )
      }
    } catch (err) {
      failed++
      failures.push({
        productId: item.productId,
        title: item.title,
        reason: err instanceof Error ? err.message : String(err),
      })
    }
  }

  payload.logger.info(
    `Done. created=${created} alreadyExisted=${skippedExisting} skippedNoImage=${skippedNoImage} failed=${failed}`,
  )

  fs.writeFileSync(
    path.join(SCRATCH_DIR, 'import_failures.json'),
    JSON.stringify(failures, null, 2),
  )

  process.exit(0)
}

main().catch((err) => {
  console.error('IMPORT FAILED', err)
  process.exit(1)
})
