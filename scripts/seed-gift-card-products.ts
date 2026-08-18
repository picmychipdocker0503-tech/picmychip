import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Additive-only script: creates three simple, non-variant "Gift Card" products
 * (₹500 / ₹1000 / ₹2000) flagged `isGiftCard: true`. They flow through the
 * existing cart/checkout/Razorpay pipeline like any other product — the
 * `issueGiftCardsForOrder` Order hook mints a real redeemable GiftCard
 * document automatically once an order containing one is placed. Never
 * touches existing products/orders/pages.
 */
const DENOMINATIONS = [500, 1000, 2000]

const GIFT_CARD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="24" fill="#7c3aed"/>
  <rect x="30" y="70" width="140" height="90" rx="12" fill="white"/>
  <rect x="30" y="95" width="140" height="18" fill="#7c3aed"/>
  <circle cx="100" cy="70" r="22" fill="#fbbf24"/>
</svg>`

const run = async () => {
  const payload = await getPayload({ config })

  const { docs: existingMedia } = await payload.find({
    collection: 'media',
    where: { alt: { equals: 'Gift card icon' } },
    limit: 1,
  })

  let media = existingMedia[0]

  if (!media) {
    const buffer = Buffer.from(GIFT_CARD_ICON_SVG)
    media = await payload.create({
      collection: 'media',
      data: { alt: 'Gift card icon' },
      file: {
        data: buffer,
        mimetype: 'image/svg+xml',
        name: 'gift-card-icon.svg',
        size: buffer.byteLength,
      },
    })
    payload.logger.info('Created gift card icon media asset.')
  }

  for (const amountINR of DENOMINATIONS) {
    const slug = `gift-card-inr-${amountINR}`

    const { docs: existing } = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing[0]) {
      payload.logger.info(`Gift card product "${slug}" already exists — skipping.`)
      continue
    }

    await payload.create({
      collection: 'products',
      data: {
        title: `Gift Card — ₹${amountINR}`,
        slug,
        isGiftCard: true,
        // priceInINR is stored in minor units (paise) — the ecommerce plugin's
        // formatCurrency always divides by 10^decimals.
        priceInINR: amountINR * 100,
        inventory: 999999,
        stockStatus: 'in-stock',
        gallery: [{ image: media.id }],
        highlights: [
          { text: `₹${amountINR} balance, redeemable on any order` },
          { text: 'Delivered instantly by email after checkout' },
          { text: 'No expiry' },
        ],
        _status: 'published',
        // Placeholder only — a gift card isn't a physical good, and its GST/SAC treatment
        // (voucher issuance vs. the underlying goods/services on redemption) needs the user's
        // own determination, not an assumed classification. Flagged the same way the existing
        // 3 gift card products were flagged in scripts/backfill-hsn-codes.ts.
        hsnCode: '9971',
      },
      overrideAccess: true,
    })

    payload.logger.info(`Created gift card product "${slug}".`)
  }

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
