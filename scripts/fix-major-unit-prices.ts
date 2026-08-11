import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// One-off correction: these 12 products had priceInUSD/priceInINR (and
// compareAt variants) entered as major-unit decimals (e.g. 24.10 dollars)
// instead of the integer minor-unit values (cents/paise) the ecommerce
// plugin's formatCurrency expects (it always divides by 10^decimals).
// Confirmed via a read-only audit: every other product in the catalog
// already stores integer cents/paise correctly. See scripts/seed-gift-card-products.ts
// for the bug that produced the three gift-card rows.
const FIXES: Record<number, { priceInUSD?: number; priceInINR?: number; compareAtPriceInUSD?: number; compareAtPriceInINR?: number }> = {
  238: { priceInUSD: 24.1, priceInINR: 2000 },
  237: { priceInUSD: 12.05, priceInINR: 1000 },
  236: { priceInUSD: 6.02, priceInINR: 500 },
  111: { priceInUSD: 5, priceInINR: 415, compareAtPriceInUSD: 6.5, compareAtPriceInINR: 539.5 },
  108: { priceInUSD: 63.732, priceInINR: 5289.76 },
  96: { priceInUSD: 66.304, priceInINR: 5503.23 },
  70: { priceInUSD: 46.26, priceInINR: 3839.58 },
  60: { priceInUSD: 1.85, priceInINR: 153.55 },
  59: { priceInUSD: 1.9, priceInINR: 157.7 },
  58: { priceInUSD: 2.2, priceInINR: 182.6 },
  56: { priceInUSD: 1.72, priceInINR: 142.76 },
  55: { priceInUSD: 1.8, priceInINR: 149.4 },
}

const run = async () => {
  const payload = await getPayload({ config })

  for (const [idStr, fields] of Object.entries(FIXES)) {
    const id = Number(idStr)
    const existing = await payload.findByID({ collection: 'products', id })

    // Safety check: confirm the current stored value still matches what we
    // audited before writing, so we never blind-overwrite a value someone
    // else already corrected or changed since the audit.
    for (const [key, expected] of Object.entries(fields)) {
      const current = (existing as any)[key]
      if (current !== expected) {
        throw new Error(
          `Refusing to update product ${id} (${existing.title}): expected ${key}=${expected} but found ${current}. Data may have changed since audit.`,
        )
      }
    }

    const data: Record<string, number> = {}
    for (const [key, value] of Object.entries(fields)) {
      data[key] = Math.round(value * 100)
    }

    await payload.update({
      collection: 'products',
      id,
      data,
      overrideAccess: true,
    })

    payload.logger.info(`Fixed product ${id} (${existing.title}): ${JSON.stringify(data)}`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
