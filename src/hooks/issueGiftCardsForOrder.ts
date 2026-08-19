import type { CollectionAfterChangeHook } from 'payload'

import { generateGiftCardCode } from '@/collections/GiftCards'
import { giftCardIssuedEmailHtml, sendMail } from '@/lib/email'

/**
 * Gift cards are modeled as a regular Product flagged `isGiftCard: true` (with
 * variants for denominations) so they flow through the existing cart/checkout/
 * PayU pipeline for free. When an order containing one is created, this
 * mints a real GiftCard document (with its own redeemable code) per unit
 * purchased and emails the code to the buyer.
 */
export const issueGiftCardsForOrder: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || !doc.items?.length) return doc

  const email =
    doc.customerEmail || (typeof doc.customer === 'object' ? doc.customer?.email : undefined)
  if (!email) return doc

  const customerId = typeof doc.customer === 'object' ? (doc.customer?.id ?? undefined) : (doc.customer ?? undefined)
  const currency = 'INR' as const
  const priceField = 'priceInINR' as const

  for (const item of doc.items) {
    const productId = typeof item.product === 'object' ? item.product?.id : item.product
    if (!productId || !item.quantity) continue

    try {
      const product = await req.payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        overrideAccess: true,
      })

      if (!product?.isGiftCard) continue

      let amount = product[priceField]

      const variantId = typeof item.variant === 'object' ? item.variant?.id : item.variant
      if (variantId) {
        const variant = await req.payload.findByID({
          collection: 'variants',
          id: variantId,
          depth: 0,
          overrideAccess: true,
        })
        if (variant && typeof variant[priceField] === 'number') amount = variant[priceField]
      }

      if (typeof amount !== 'number' || amount <= 0) continue

      const cardAmount: number = amount
      const recipientEmail: string = email
      const buyerId: number | undefined = customerId
      const sourceOrderId: number = doc.id

      for (let i = 0; i < item.quantity; i++) {
        const giftCard = await req.payload.create({
          collection: 'gift-cards',
          data: {
            code: generateGiftCardCode(),
            initialAmount: cardAmount,
            balance: cardAmount,
            currency,
            recipientEmail,
            purchasedBy: buyerId,
            sourceOrder: sourceOrderId,
            status: 'active',
          },
          overrideAccess: true,
        })

        await sendMail(req.payload, {
          to: email,
          subject: 'Your gift card is ready',
          html: giftCardIssuedEmailHtml(giftCard),
          emailType: 'GIFT_CARD_ISSUED',
          eventId: `GIFT_CARD_ISSUED_${sourceOrderId}_${giftCard.code}`,
        })
      }
    } catch (err) {
      req.payload.logger.error({ msg: 'Failed to issue gift card for order item', err })
    }
  }

  return doc
}
