import type { CollectionAfterChangeHook } from 'payload'

import { refundPayuPayment } from '@/lib/payuRefund'

/**
 * Fires the actual money-back-to-customer step the moment an admin sets a
 * return request to "Approved" — without this, "Approved" was just a status
 * label and someone had to remember to go issue the refund in the PayU
 * dashboard separately. Card orders get refunded via PayU automatically;
 * COD/gift-card orders have no electronic payment to reverse automatically,
 * so those are flagged `manual-required` rather than silently doing nothing.
 */
export const processReturnRefund: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const justApproved = doc.status === 'approved' && previousDoc?.status !== 'approved'
  if (!justApproved || doc.refundStatus !== 'not-applicable') return doc

  const orderId = typeof doc.order === 'object' ? doc.order?.id : doc.order
  if (!orderId) return doc

  try {
    const order = await req.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
      overrideAccess: true,
    })

    const refundAmount = doc.refundAmount ?? order.amount ?? 0

    if (order.paymentMethod !== 'card') {
      await req.payload.update({
        collection: 'return-requests',
        id: doc.id,
        data: {
          refundStatus: 'manual-required',
          refundNote: `Order was paid via ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'gift card'} — no electronic payment to auto-reverse. Refund the customer manually.`,
        },
        overrideAccess: true,
      })
      return doc
    }

    const transactionRefs = order.transactions || []
    let paymentId: string | undefined

    for (const ref of transactionRefs) {
      const transactionId = typeof ref === 'object' ? ref.id : ref
      const transaction = await req.payload.findByID({
        collection: 'transactions',
        id: transactionId,
        depth: 0,
        overrideAccess: true,
      })
      if (transaction?.paymentMethod === 'payu' && (transaction as any)?.payu?.mihpayid) {
        paymentId = (transaction as any).payu.mihpayid
        break
      }
    }

    if (!paymentId) {
      await req.payload.update({
        collection: 'return-requests',
        id: doc.id,
        data: {
          refundStatus: 'failed',
          refundNote: 'No PayU payment found on this order — refund manually.',
        },
        overrideAccess: true,
      })
      return doc
    }

    await refundPayuPayment({ amount: refundAmount, paymentId })

    await Promise.all([
      req.payload.update({
        collection: 'return-requests',
        id: doc.id,
        data: {
          refundStatus: 'processed',
          refundNote: `Refunded ${order.currency || 'INR'} ${refundAmount} via PayU.`,
        },
        overrideAccess: true,
      }),
      req.payload.update({
        collection: 'orders',
        id: order.id,
        data: { status: 'refunded' },
        overrideAccess: true,
      }),
    ])
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to process return refund', err, returnRequestId: doc.id })
    await req.payload
      .update({
        collection: 'return-requests',
        id: doc.id,
        data: {
          refundStatus: 'failed',
          refundNote: err instanceof Error ? err.message : 'Refund failed — see server logs.',
        },
        overrideAccess: true,
      })
      .catch(() => {})
  }

  return doc
}
