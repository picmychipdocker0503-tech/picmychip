import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Auto-derives `verifiedPurchase` by checking whether the reviewing customer
 * has a completed order containing this product — can't be set by hand since
 * it's a factual claim about order history, not a business decision.
 */
export const deriveVerifiedPurchase: CollectionBeforeChangeHook = async ({ data, req }) => {
  const customerId = typeof data?.customer === 'object' ? data.customer?.id : data?.customer
  const productId = typeof data?.product === 'object' ? data.product?.id : data?.product

  if (!customerId || !productId) {
    return { ...data, verifiedPurchase: false }
  }

  const { totalDocs } = await req.payload.find({
    collection: 'orders',
    limit: 0,
    overrideAccess: true,
    where: {
      and: [
        { customer: { equals: customerId } },
        { status: { equals: 'completed' } },
        { 'items.product': { equals: productId } },
      ],
    },
  })

  return {
    ...data,
    verifiedPurchase: totalDocs > 0,
  }
}
