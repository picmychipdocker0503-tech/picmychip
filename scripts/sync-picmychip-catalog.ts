import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { CATEGORY_HSN, FALLBACK_HSN } from './hsnCategoryMap'

const SCRATCH_DIR =
  'C:/Users/PICMYC~1/AppData/Local/Temp/claude/d--Picmychip-picmychip/b75156b5-b350-4398-ad2d-88633b5cb39d/scratchpad'

const FAN_FILTER_PRODUCT_ID = '1911056000001899883' // "40mm Fan Filter" — replaced by the 4 Inch Cooling Fan, intentionally excluded

// The storefront (picmychip.com / Zoho Commerce) keeps Brass / Nylon / Nylon
// with Brass as separate categories; this catalog merges all three into a
// single "Studs and Spacers" category (id 1) — but HSN classification still
// follows the underlying material, so it's looked up by the *original* live
// category name, not the merged one.
const MERGED_INTO_STUDS_AND_SPACERS = new Set(['Brass', 'Nylon', 'Nylon with Brass'])
const STUDS_AND_SPACERS_CATEGORY_ID = 1

// Live category_name -> Payload category title, for names that differ only
// in formatting/spelling from what's already in this catalog.
const CATEGORY_TITLE_ALIASES: Record<string, string> = {
  'Nuts and Screw': 'Nuts & Screws',
  '': 'USB Cables', // the one live product with a blank category is a USB-A to USB-A cable
}

const textNode = (text: string) => ({ type: 'text', text, version: 1 })
const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})
const richText = (text: string) => ({
  root: {
    type: 'root',
    children: [paragraph(text)],
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

const parseStock = (value: unknown): number => {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

async function main() {
  const toCreate: any[] = JSON.parse(fs.readFileSync(path.join(SCRATCH_DIR, 'to-create.json'), 'utf-8'))
  const toUpdate: { live: any; db: any }[] = JSON.parse(
    fs.readFileSync(path.join(SCRATCH_DIR, 'to-update.json'), 'utf-8'),
  )

  const payload = await getPayload({ config })
  payload.logger.info(`Syncing picmychip.com catalog: ${toCreate.length} to create, ${toUpdate.length} to check for updates`)

  // -------------------------------------------------------------------
  // Categories — resolve/create Payload category IDs for every distinct
  // live category among the products we're about to create.
  // -------------------------------------------------------------------
  const categoryIdByLiveName = new Map<string, number>()
  for (const item of toCreate) {
    const liveCategory = item.category_name || ''
    if (categoryIdByLiveName.has(liveCategory)) continue

    if (MERGED_INTO_STUDS_AND_SPACERS.has(liveCategory)) {
      categoryIdByLiveName.set(liveCategory, STUDS_AND_SPACERS_CATEGORY_ID)
      continue
    }

    const title = CATEGORY_TITLE_ALIASES[liveCategory] ?? liveCategory
    const existing = await payload.find({
      collection: 'categories',
      where: { title: { equals: title } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs[0]) {
      categoryIdByLiveName.set(liveCategory, existing.docs[0].id as number)
      continue
    }
    const created = await payload.create({
      collection: 'categories',
      data: { title, slug: slugify(title), specSchemaType: 'none' },
    })
    payload.logger.info(`— created category "${title}" (id ${created.id})`)
    categoryIdByLiveName.set(liveCategory, created.id as number)
  }

  // -------------------------------------------------------------------
  // Create missing products (no images — none of these are RF Cables)
  // -------------------------------------------------------------------
  let created = 0
  let createSkipped = 0
  let createFailed = 0
  const createFailures: { name: string; reason: string }[] = []

  for (const item of toCreate) {
    if (item.product_id === FAN_FILTER_PRODUCT_ID) {
      createSkipped++
      continue
    }
    try {
      const liveCategory = item.category_name || ''
      const categoryId = categoryIdByLiveName.get(liveCategory)
      const hsnCode = CATEGORY_HSN[liveCategory] ?? FALLBACK_HSN
      const slug = (item.url && slugify(item.url)) || slugify(item.name)
      const description =
        (item.product_short_description || item.product_description || item.name || '').trim() || item.name

      await payload.create({
        collection: 'products',
        depth: 0,
        data: {
          title: item.name,
          slug,
          _status: 'published',
          description: richText(description),
          categories: categoryId ? [categoryId] : [],
          specSchemaType: 'none',
          hsnCode,
          priceInINR: Math.round((item.min_rate || 0) * 100),
          inventory: parseStock(item.overall_stock),
        } as any,
      })
      created++
    } catch (err) {
      createFailed++
      createFailures.push({ name: item.name, reason: err instanceof Error ? err.message : String(err) })
    }
  }

  payload.logger.info(
    `Create pass done: created=${created} skippedFanFilter=${createSkipped} failed=${createFailed}`,
  )

  // -------------------------------------------------------------------
  // Sync price/inventory for products that already exist
  // -------------------------------------------------------------------
  let updated = 0
  let unchanged = 0
  let updateFailed = 0
  const updateFailures: { title: string; reason: string }[] = []

  for (const { live, db } of toUpdate) {
    if (live.product_id === FAN_FILTER_PRODUCT_ID) continue
    try {
      const newPrice = Math.round((live.min_rate || 0) * 100)
      const newInventory = parseStock(live.overall_stock)
      if (db.priceInINR === newPrice && db.inventory === newInventory) {
        unchanged++
        continue
      }
      await payload.update({
        collection: 'products',
        id: db.id,
        depth: 0,
        data: { priceInINR: newPrice, inventory: newInventory },
      })
      updated++
      if ((updated + unchanged + updateFailed) % 50 === 0) {
        payload.logger.info(`— progress: ${updated} updated, ${unchanged} already in sync, ${updateFailed} failed`)
      }
    } catch (err) {
      updateFailed++
      updateFailures.push({ title: db.title, reason: err instanceof Error ? err.message : String(err) })
    }
  }

  payload.logger.info(`Update pass done: updated=${updated} unchanged=${unchanged} failed=${updateFailed}`)

  fs.writeFileSync(
    path.join(SCRATCH_DIR, 'sync_failures.json'),
    JSON.stringify({ createFailures, updateFailures }, null, 2),
  )

  process.exit(0)
}

main().catch((err) => {
  console.error('SYNC FAILED', err)
  process.exit(1)
})
