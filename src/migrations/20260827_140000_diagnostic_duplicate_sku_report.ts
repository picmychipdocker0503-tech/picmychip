import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

// Diagnostic-only migration — makes NO schema or data changes. It exists
// purely to run once, with the real production credentials Payload already
// has at deploy time, and print a duplicate-SKU report to the build/runtime
// logs. Local scripts can't get the real DATABASE_URL/POSTGRES_CA_CERT since
// they're marked Sensitive in Vercel (masked as "[SENSITIVE]" by `vercel env
// pull`) — running inside the actual deploy sidesteps that entirely.
//
// Finds products whose SKU is the same once leading zeros are stripped
// (e.g. "638190000" and "0638190000") — the pattern behind a broken
// "Frequently Bought Together" card (missing image + 404 on click) reported
// on the live site.

const normalizeNumericSku = (sku: string): string | null => {
  const trimmed = sku.trim()
  if (!/^\d+$/.test(trimmed)) return null
  return trimmed.replace(/^0+(?=\d)/, '')
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const allProducts: {
    id: number
    title: string
    sku: string | null | undefined
    slug: string | null | undefined
    galleryLen: number
  }[] = []

  let page = 1
  for (;;) {
    const { docs, hasNextPage } = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 200,
      page,
      overrideAccess: true,
      select: { title: true, sku: true, slug: true, gallery: true },
    })

    for (const doc of docs) {
      allProducts.push({
        id: doc.id,
        title: doc.title,
        sku: doc.sku,
        slug: doc.slug,
        galleryLen: doc.gallery?.length ?? 0,
      })
    }

    if (!hasNextPage) break
    page += 1
  }

  payload.logger.info(`[duplicate-sku-scan] Scanned ${allProducts.length} products.`)

  const byNormalizedSku = new Map<string, typeof allProducts>()
  for (const product of allProducts) {
    if (!product.sku) continue
    const normalized = normalizeNumericSku(product.sku)
    if (normalized === null) continue
    byNormalizedSku.set(normalized, [...(byNormalizedSku.get(normalized) ?? []), product])
  }

  let foundAny = false
  for (const [normalized, group] of byNormalizedSku) {
    if (group.length < 2) continue
    // Only report genuine leading-zero-style mismatches, not byte-identical SKUs.
    const distinctRawSkus = new Set(group.map((p) => p.sku))
    if (distinctRawSkus.size < 2) continue

    foundAny = true
    const details = group
      .map(
        (p) =>
          `id=${p.id} sku="${p.sku}" slug=${JSON.stringify(p.slug)} title="${p.title}" images=${p.galleryLen}` +
          `${!p.slug ? ' <-- MISSING SLUG' : ''}${p.galleryLen === 0 ? ' <-- NO IMAGES' : ''}`,
      )
      .join(' | ')

    payload.logger.warn(`[duplicate-sku-scan] Normalized SKU "${normalized}" has ${group.length} products: ${details}`)
  }

  if (!foundAny) payload.logger.info('[duplicate-sku-scan] No leading-zero duplicate SKUs found.')
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Diagnostic-only migration — nothing to revert.
}
