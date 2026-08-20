import type { Brand, Category, Product } from '@/payload-types'

import { getGeneralComparisonRows, getSpecRows } from '@/components/product/specTableRows'
import { richTextToPlainText } from '@/utilities/richTextToPlainText'

export type ProductFaqItem = { question: string; answer: string }

const STOCK_ANSWER: Record<string, (title: string, leadTimeDays?: number | null) => string> = {
  'in-stock': (title) =>
    `Yes, the ${title} is in stock and ready to ship. Orders placed before 3 PM dispatch the same business day.`,
  'low-stock': (title) =>
    `The ${title} is currently in low stock. It's still available to order, but we'd recommend confirming quantity before placing a large order.`,
  'out-of-stock': (title) =>
    `The ${title} is currently out of stock. You can sign up on the product page to be notified as soon as it's back.`,
  backorder: (title, leadTimeDays) =>
    `The ${title} is available on backorder${leadTimeDays ? ` with an estimated lead time of ${leadTimeDays} days` : ''}.`,
}

// Rows already answered by a dedicated, better-phrased question below —
// repeating them as generic "What is the X of Y?" would be redundant.
const SKIP_SPEC_LABELS = new Set(['Brand', 'Category', 'Price', 'Availability', 'Datasheet'])

/**
 * Synthesizes a handful of product-specific FAQ/Q&A pairs from real,
 * structured product data — no per-product manual writing required, so it
 * scales across the whole catalog. Renders as an on-page accordion (for
 * visitors) and FAQPage JSON-LD (for search + answer-engine crawlers), the
 * same pattern the CMS-authored FAQ block already uses site-wide.
 */
export const generateProductFaqs = (product: Product): ProductFaqItem[] => {
  const items: ProductFaqItem[] = []
  const title = product.title

  // 1. What is it?
  const description = richTextToPlainText(product.description).trim()
  const firstHighlight = product.highlights?.[0]?.text
  const whatIsAnswer = description || firstHighlight
  if (whatIsAnswer) {
    items.push({ question: `What is the ${title}?`, answer: whatIsAnswer })
  }

  // 2. Stock / shipping
  if (product.stockStatus && STOCK_ANSWER[product.stockStatus]) {
    items.push({
      question: `Is the ${title} in stock and ready to ship?`,
      answer: STOCK_ANSWER[product.stockStatus](title, product.leadTimeDays),
    })
  }

  // 3. Price
  if (typeof product.priceInINR === 'number') {
    const hasDiscount =
      typeof product.compareAtPriceInINR === 'number' && product.compareAtPriceInINR > product.priceInINR
    const priceAnswer = hasDiscount
      ? `The ${title} is priced at ₹${product.priceInINR.toFixed(2)}, discounted from ₹${product.compareAtPriceInINR!.toFixed(2)}.`
      : `The ${title} is priced at ₹${product.priceInINR.toFixed(2)}.`
    items.push({ question: `How much does the ${title} cost?`, answer: priceAnswer })
  }

  // 4. Bulk pricing
  if (product.priceTiers?.length) {
    const cheapest = [...product.priceTiers].sort((a, b) => (a.minQuantity ?? 0) - (b.minQuantity ?? 0))
    const best = cheapest[cheapest.length - 1]
    items.push({
      question: `Is bulk or volume pricing available for the ${title}?`,
      answer: `Yes — tiered pricing kicks in starting at ${cheapest[0]?.minQuantity} units${
        best?.minQuantity && best.minQuantity !== cheapest[0]?.minQuantity
          ? `, down to ₹${best.priceInINR?.toFixed(2)} per unit at ${best.minQuantity}+ units`
          : ''
      }. See the Bulk Pricing table on this page for the full breakdown.`,
    })
  }

  // 5. Brand / manufacturer
  const brand = typeof product.brand === 'object' ? (product.brand as Brand | null) : null
  if (brand?.title) {
    items.push({
      question: `Who manufactures the ${title}?`,
      answer: `The ${title} is manufactured by ${brand.title}.`,
    })
  }

  // 6. Category
  const categories = (product.categories ?? []).filter(
    (category): category is Category => typeof category === 'object',
  )
  if (categories.length > 0) {
    const categoryNames = categories.map((category) => category.title).join(' and ')
    items.push({
      question: `What category of component is the ${title}?`,
      answer: `The ${title} is listed under ${categoryNames} in our catalog, and every listing in that category is datasheet-verified.`,
    })
  }

  // 7. Datasheet
  const datasheetCount = (product.datasheets ?? []).filter(
    (doc) => typeof doc === 'object' && Boolean(doc?.url),
  ).length
  if (datasheetCount > 0) {
    items.push({
      question: `Is a datasheet available for the ${title}?`,
      answer: `Yes, ${datasheetCount > 1 ? `${datasheetCount} datasheets are` : 'a datasheet is'} available for download on this page under the Datasheets section.`,
    })
  }

  // 8. Real specs (skip anything already covered above; cap to 3 to keep
  //    the list scannable rather than dumping the entire spec table twice).
  const specRows = [...getGeneralComparisonRows(product), ...getSpecRows(product)].filter(
    (row) => !SKIP_SPEC_LABELS.has(row.label),
  )
  for (const row of specRows.slice(0, 3)) {
    items.push({
      question: `What is the ${row.label.toLowerCase()} of the ${title}?`,
      answer: `The ${row.label.toLowerCase()} of the ${title} is ${row.value}.`,
    })
  }

  // 9. Returns — always relevant, always true site-wide policy.
  items.push({
    question: `Can I return the ${title} if it doesn't fit my project?`,
    answer: `Yes — unopened components including the ${title} can be returned within 7 days of delivery for a full refund or exchange.`,
  })

  return items
}
