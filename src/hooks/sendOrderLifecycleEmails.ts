import type { CollectionAfterChangeHook } from 'payload'

import { orderConfirmationEmailHtml, sendMail, shippingUpdateEmailHtml } from '@/lib/email'

export const sendOrderLifecycleEmails: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const email =
    doc.customerEmail || (typeof doc.customer === 'object' ? doc.customer?.email : undefined)

  if (!email) return doc

  if (operation === 'create') {
    await sendMail(req.payload, {
      to: email,
      subject: `Order confirmed — #${doc.id}`,
      html: orderConfirmationEmailHtml(doc),
    })
    return doc
  }

  const trackingJustAdded = Boolean(doc.trackingNumber) && doc.trackingNumber !== previousDoc?.trackingNumber
  const justCompleted = doc.status === 'completed' && previousDoc?.status !== 'completed'

  if (trackingJustAdded || justCompleted) {
    await sendMail(req.payload, {
      to: email,
      subject: `Shipping update for order #${doc.id}`,
      html: shippingUpdateEmailHtml(doc),
    })
  }

  return doc
}
