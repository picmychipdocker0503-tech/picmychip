import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Amazon-style address book: at most one address per customer can be the
 * default billing address, and at most one can be the default shipping
 * address (the same address may hold both). Setting either flag true on one
 * address clears it on that customer's other addresses.
 */
const DEFAULT_FLAG_FIELDS = ['isDefaultBilling', 'isDefaultShipping'] as const

export const enforceSingleDefaultAddress: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
  operation,
}) => {
  const customerId =
    typeof data.customer === 'object' && data.customer !== null
      ? data.customer.id
      : (data.customer ?? originalDoc?.customer)

  if (!customerId) return data

  for (const field of DEFAULT_FLAG_FIELDS) {
    if (!data[field]) continue

    const { docs } = await req.payload.find({
      collection: 'addresses',
      where: {
        customer: { equals: customerId },
        [field]: { equals: true },
        ...(operation === 'update' && originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
      },
      limit: 0,
      depth: 0,
      req,
      overrideAccess: true,
    })

    await Promise.all(
      docs.map((doc) =>
        req.payload.update({
          collection: 'addresses',
          id: doc.id,
          data: { [field]: false },
          req,
          overrideAccess: true,
        }),
      ),
    )
  }

  return data
}
