import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { CATEGORY_HSN, FLAGGED_HSN_CATEGORIES as FLAGGED_CATEGORIES } from './hsnCategoryMap'

// One-off backfill: assigns a standard HSN code to every product that
// doesn't have one yet, based on its category (falling back to a title
// keyword match for the handful of uncategorized products). These are
// best-effort classifications by product type, not a compliance
// determination — same caveat as the disclaimer on the printable invoice
// page ("consult your tax advisor to confirm the applicable GST
// treatment"). Flagged items (gift cards, and the few genuinely mixed
// catch-all categories) are logged separately for a manual spot-check.
// Safe to re-run: only touches products with a null/empty hsnCode.

const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'products',
    limit: 1000,
    depth: 1,
    overrideAccess: true,
    select: { title: true, slug: true, categories: true, hsnCode: true },
  })

  const toUpdate: Array<{ id: number | string; title: string; hsnCode: string; reason: string }> = []
  const skippedEmpty: Array<{ id: number | string }> = []
  const needsManualReview: Array<{ id: number | string; title: string; reason: string }> = []

  for (const doc of docs) {
    if (doc.hsnCode) continue // already set — never overwrite

    if (!doc.title) {
      // Empty draft record (no title/slug/price) — nothing to classify.
      skippedEmpty.push({ id: doc.id })
      continue
    }

    const categories = Array.isArray(doc.categories) ? doc.categories : []
    const categoryNames = categories.map((c) => (typeof c === 'object' && c ? c.title : null)).filter(Boolean) as string[]

    const matchedCategory = categoryNames.find((name) => CATEGORY_HSN[name])

    if (matchedCategory) {
      toUpdate.push({
        id: doc.id,
        title: doc.title,
        hsnCode: CATEGORY_HSN[matchedCategory],
        reason: `category: ${matchedCategory}${FLAGGED_CATEGORIES.has(matchedCategory) ? ' (mixed category — spot-check)' : ''}`,
      })
      continue
    }

    // No usable category — fall back to a title keyword match.
    const title = doc.title.toLowerCase()
    if (title.includes('gift card')) {
      needsManualReview.push({
        id: doc.id,
        title: doc.title,
        reason: 'Gift card — not a physical good; HSN/SAC classification for pre-paid vouchers needs your own determination.',
      })
      continue
    }
    if (title.includes('resistor')) {
      toUpdate.push({ id: doc.id, title: doc.title, hsnCode: CATEGORY_HSN.Resistor, reason: 'title keyword: resistor' })
      continue
    }
    if (title.includes('ffc cable') || title.includes('cable')) {
      toUpdate.push({ id: doc.id, title: doc.title, hsnCode: CATEGORY_HSN.Cables, reason: 'title keyword: cable' })
      continue
    }

    needsManualReview.push({ id: doc.id, title: doc.title, reason: 'No category and no title keyword match.' })
  }

  console.log(`\nProducts to update: ${toUpdate.length}`)
  console.log(`Empty draft records skipped (no title): ${skippedEmpty.length}`)
  console.log(`Needs manual review (not touched): ${needsManualReview.length}`)
  for (const item of needsManualReview) {
    console.log(`  - [${item.id}] ${item.title} — ${item.reason}`)
  }

  const flaggedForSpotCheck = toUpdate.filter((u) => u.reason.includes('spot-check'))
  if (flaggedForSpotCheck.length > 0) {
    console.log(`\nAssigned but flagged for a spot-check (mixed categories, ${flaggedForSpotCheck.length} products):`)
    for (const item of flaggedForSpotCheck) {
      console.log(`  - [${item.id}] ${item.title} -> ${item.hsnCode} (${item.reason})`)
    }
  }

  const dryRun = process.argv.includes('--dry-run')
  if (dryRun) {
    console.log('\n--dry-run passed — no writes performed.')
    process.exit(0)
  }

  console.log(`\nApplying ${toUpdate.length} updates...`)
  let updated = 0
  for (const item of toUpdate) {
    await payload.update({
      collection: 'products',
      id: item.id,
      data: { hsnCode: item.hsnCode },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    updated++
  }
  console.log(`Done. Updated ${updated} products.`)

  process.exit(0)
}

run()
