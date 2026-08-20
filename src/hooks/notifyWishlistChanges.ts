import type { CollectionAfterChangeHook } from 'payload'

import { backInStockEmailHtml, priceDropEmailHtml, sendMail } from '@/lib/email'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Wishlisting a product is an implicit "notify me" — unlike StockAlerts,
 * there's no separate opt-in form. Covers both restocks and price drops in
 * one pass over the product's wishlist entries, scoped to the base product
 * price only (not per-variant pricing — see Wishlists collection comments).
 */
export const notifyWishlistChanges: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update') return doc

  const wasOut = previousDoc?.stockStatus === 'out-of-stock'
  const nowAvailable = doc.stockStatus === 'in-stock' || doc.stockStatus === 'low-stock'
  const wentOutOfStock = previousDoc?.stockStatus !== 'out-of-stock' && doc.stockStatus === 'out-of-stock'

  const priceDropped =
    typeof previousDoc?.priceInINR === 'number' &&
    typeof doc.priceInINR === 'number' &&
    doc.priceInINR < previousDoc.priceInINR

  if (!wasOut && !wentOutOfStock && !priceDropped) return doc

  try {
    const { docs: entries } = await req.payload.find({
      collection: 'wishlists',
      depth: 1,
      limit: 500,
      overrideAccess: true,
      where: { product: { equals: doc.id } },
    })

    if (entries.length === 0) return doc

    const siteUrl = getServerSideURL()

    // Product went out of stock — clear the stamp so the *next* restock
    // (not just the first one ever) notifies these customers again.
    if (wentOutOfStock) {
      for (const entry of entries) {
        if (!entry.stockAlertSentAt) continue
        await req.payload.update({
          collection: 'wishlists',
          id: entry.id,
          data: { stockAlertSentAt: null },
          overrideAccess: true,
        })
      }
    }

    for (const entry of entries) {
      const email = typeof entry.customer === 'object' ? entry.customer?.email : undefined
      if (!email) continue

      if (wasOut && nowAvailable && !entry.stockAlertSentAt) {
        await sendMail(req.payload, {
          to: email,
          subject: `${doc.title} is back in stock`,
          html: backInStockEmailHtml(doc),
          emailType: 'WISHLIST_BACK_IN_STOCK',
          eventId: `WISHLIST_BACK_IN_STOCK_${entry.id}_${doc.updatedAt}`,
        })

        await req.payload.update({
          collection: 'wishlists',
          id: entry.id,
          data: { stockAlertSentAt: new Date().toISOString() },
          overrideAccess: true,
        })
      }

      if (priceDropped) {
        const baseline = entry.lastNotifiedPrice ?? entry.priceAtAdd
        if (typeof baseline === 'number' && doc.priceInINR < baseline) {
          await sendMail(req.payload, {
            to: email,
            subject: `Price drop: ${doc.title}`,
            html: priceDropEmailHtml({
              title: doc.title,
              slug: doc.slug,
              oldPrice: baseline,
              newPrice: doc.priceInINR,
              siteUrl,
            }),
            emailType: 'WISHLIST_PRICE_DROP',
            eventId: `WISHLIST_PRICE_DROP_${entry.id}_${doc.priceInINR}`,
          })

          await req.payload.update({
            collection: 'wishlists',
            id: entry.id,
            data: { lastNotifiedPrice: doc.priceInINR },
            overrideAccess: true,
          })
        }
      }
    }
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to send wishlist notifications', err })
  }

  return doc
}
