import type { CollectionAfterChangeHook } from 'payload'

import { backInStockEmailHtml, sendMail } from '@/lib/email'

export const notifyBackInStock: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') return doc

  const wasOut = previousDoc?.stockStatus === 'out-of-stock'
  const nowAvailable = doc.stockStatus === 'in-stock' || doc.stockStatus === 'low-stock'
  if (!wasOut || !nowAvailable) return doc

  try {
    const { docs: alerts } = await req.payload.find({
      collection: 'stock-alerts',
      where: {
        and: [{ product: { equals: doc.id } }, { notifiedAt: { exists: false } }],
      },
      limit: 200,
      overrideAccess: true,
    })

    for (const alert of alerts) {
      await sendMail(req.payload, {
        to: alert.email,
        subject: `${doc.title} is back in stock`,
        html: backInStockEmailHtml(doc),
      })

      await req.payload.update({
        collection: 'stock-alerts',
        id: alert.id,
        data: { notifiedAt: new Date().toISOString() },
        overrideAccess: true,
      })
    }
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to send back-in-stock notifications', err })
  }

  return doc
}
