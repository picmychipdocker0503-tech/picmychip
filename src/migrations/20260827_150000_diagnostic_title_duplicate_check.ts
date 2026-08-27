import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

// Diagnostic-only migration — makes NO schema or data changes.
//
// Follow-up to 20260827_140000_diagnostic_duplicate_sku_report, which
// scanned the `sku` field and found no leading-zero duplicates. Re-reading
// FrequentlyBoughtTogether.tsx showed the number displayed under each
// companion card is actually `item.title`, not `sku` — and this catalog
// often uses literal part-number strings as the product title. So this
// migration checks the `title` field instead: first an exact lookup for the
// two literal strings reported in the bug ("638190000" / "0638190000"),
// then a full leading-zero-normalized scan across every product's title, in
// case there are other similar near-duplicates in the catalog.

const normalizeNumericTitle = (title: string | null | undefined): string | null => {
  if (!title) return null
  const trimmed = title.trim()
  if (!/^\d+$/.test(trimmed)) return null
  return trimmed.replace(/^0+(?=\d)/, '')
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const exactMatches = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: { or: [{ title: { equals: '638190000' } }, { title: { equals: '0638190000' } }] },
    select: { title: true, sku: true, slug: true, gallery: true, _status: true, createdAt: true },
  })

  payload.logger.info(`[duplicate-title-scan] Exact literal match count: ${exactMatches.totalDocs}`)
  for (const doc of exactMatches.docs) {
    payload.logger.warn(
      `[duplicate-title-scan] EXACT MATCH id=${doc.id} title="${doc.title}" sku=${JSON.stringify(doc.sku)} ` +
        `slug=${JSON.stringify(doc.slug)} status=${doc._status} images=${doc.gallery?.length ?? 0} createdAt=${doc.createdAt}`,
    )
  }

  const allProducts: { id: number; title: string; sku: string | null | undefined; slug: string | null | undefined; galleryLen: number }[] = []
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
      allProducts.push({ id: doc.id, title: doc.title, sku: doc.sku, slug: doc.slug, galleryLen: doc.gallery?.length ?? 0 })
    }
    if (!hasNextPage) break
    page += 1
  }

  payload.logger.info(`[duplicate-title-scan] Scanned ${allProducts.length} products for leading-zero title duplicates.`)

  const byNormalizedTitle = new Map<string, typeof allProducts>()
  for (const product of allProducts) {
    const normalized = normalizeNumericTitle(product.title)
    if (normalized === null) continue
    byNormalizedTitle.set(normalized, [...(byNormalizedTitle.get(normalized) ?? []), product])
  }

  let foundAny = false
  for (const [normalized, group] of byNormalizedTitle) {
    if (group.length < 2) continue
    const distinctRawTitles = new Set(group.map((p) => p.title))
    if (distinctRawTitles.size < 2) continue

    foundAny = true
    const details = group
      .map(
        (p) =>
          `id=${p.id} title="${p.title}" sku=${JSON.stringify(p.sku)} slug=${JSON.stringify(p.slug)} images=${p.galleryLen}` +
          `${!p.slug ? ' <-- MISSING SLUG' : ''}${p.galleryLen === 0 ? ' <-- NO IMAGES' : ''}`,
      )
      .join(' | ')

    payload.logger.warn(`[duplicate-title-scan] Normalized title "${normalized}" has ${group.length} products: ${details}`)
  }

  if (!foundAny) payload.logger.info('[duplicate-title-scan] No leading-zero duplicate titles found.')
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Diagnostic-only migration — nothing to revert.
}
