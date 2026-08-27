import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Read-only report — makes no changes. Run this against PRODUCTION by
// pointing DATABASE_URL (and POSTGRES_CA_CERT, if RDS) at the production
// database for this one run only, e.g.:
//
//   DATABASE_URL="<production connection string>" POSTGRES_CA_CERT=./certs/rds-ca.pem npx tsx scripts/_tmp-find-duplicate-skus.ts
//
// Groups products whose SKU is the same once leading zeros are stripped
// (e.g. "638190000" and "0638190000") — the pattern behind the broken
// "Frequently Bought Together" card (missing image + 404 on click).
// Also flags exact-duplicate SKUs (case/whitespace-insensitive) for any
// non-purely-numeric SKUs, since those are duplicates too even though
// leading-zero stripping doesn't apply to them.

const normalizeNumericSku = (sku: string): string | null => {
  const trimmed = sku.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const stripped = trimmed.replace(/^0+(?=\d)/, '')
  return stripped
}

async function main() {
  const payload = await getPayload({ config })

  const allProducts: {
    id: number
    title: string
    sku: string | null | undefined
    slug: string | null | undefined
    galleryLen: number
    status: string | null | undefined
    stockStatus: string | null | undefined
  }[] = []

  let page = 1
  for (;;) {
    const { docs, hasNextPage } = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 200,
      page,
      overrideAccess: true,
      select: { title: true, sku: true, slug: true, gallery: true, _status: true, stockStatus: true },
    })

    for (const doc of docs) {
      allProducts.push({
        id: doc.id,
        title: doc.title,
        sku: doc.sku,
        slug: doc.slug,
        galleryLen: doc.gallery?.length ?? 0,
        status: doc._status,
        stockStatus: doc.stockStatus,
      })
    }

    if (!hasNextPage) break
    page += 1
  }

  console.log(`Scanned ${allProducts.length} products.\n`)

  // Group by normalized (leading-zero-stripped) numeric SKU.
  const byNormalizedSku = new Map<string, typeof allProducts>()
  // Group by exact-trimmed-lowercased SKU (catches non-numeric duplicates too).
  const byExactSku = new Map<string, typeof allProducts>()

  for (const product of allProducts) {
    if (!product.sku) continue

    const normalized = normalizeNumericSku(product.sku)
    if (normalized !== null) {
      const key = normalized
      byNormalizedSku.set(key, [...(byNormalizedSku.get(key) ?? []), product])
    }

    const exactKey = product.sku.trim().toLowerCase()
    byExactSku.set(exactKey, [...(byExactSku.get(exactKey) ?? []), product])
  }

  let foundAny = false

  console.log('=== Leading-zero duplicate SKUs (numeric) ===')
  for (const [normalized, group] of byNormalizedSku) {
    if (group.length < 2) continue
    // Skip if every SKU in the group is byte-identical (already covered by
    // the exact-duplicate section below) — only report genuine
    // leading-zero-style mismatches here.
    const distinctRawSkus = new Set(group.map((p) => p.sku))
    if (distinctRawSkus.size < 2) continue

    foundAny = true
    console.log(`\nNormalized SKU "${normalized}" — ${group.length} products:`)
    for (const product of group) {
      console.log(
        `  id=${product.id} sku="${product.sku}" slug=${JSON.stringify(product.slug)} title="${product.title}" ` +
          `status=${product.status} stock=${product.stockStatus} images=${product.galleryLen}` +
          `${!product.slug ? '  <-- MISSING SLUG (404s on click)' : ''}` +
          `${product.galleryLen === 0 ? '  <-- NO IMAGES' : ''}`,
      )
    }
  }
  if (!foundAny) console.log('(none found)')

  console.log('\n=== Exact-duplicate SKUs (any format) ===')
  let foundExact = false
  for (const [exactKey, group] of byExactSku) {
    if (group.length < 2) continue
    foundExact = true
    console.log(`\nSKU "${exactKey}" — ${group.length} products:`)
    for (const product of group) {
      console.log(
        `  id=${product.id} slug=${JSON.stringify(product.slug)} title="${product.title}" ` +
          `status=${product.status} stock=${product.stockStatus} images=${product.galleryLen}` +
          `${!product.slug ? '  <-- MISSING SLUG (404s on click)' : ''}` +
          `${product.galleryLen === 0 ? '  <-- NO IMAGES' : ''}`,
      )
    }
  }
  if (!foundExact) console.log('(none found)')

  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
