import type { CollectionBeforeValidateHook } from 'payload'

/**
 * `email` on Addresses was added after this collection already had live
 * data — confirmed live, several pre-existing rows had it stored as an
 * empty string, which fails the field's own "valid email" validation on
 * every subsequent save (even one that only touches an unrelated field,
 * like deactivating the address), permanently blocking any edit to that
 * row. Backfills from the linked customer's account email before
 * validation runs, so an old row heals itself the next time it's touched
 * instead of staying stuck.
 */
export const backfillAddressEmail: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data) return data
  if (data.email) return data

  const existingEmail = originalDoc?.email
  if (existingEmail) return data

  const customerId =
    typeof data.customer === 'object' && data.customer !== null
      ? data.customer.id
      : (data.customer ?? originalDoc?.customer)
  if (!customerId) return data

  try {
    const customer = await req.payload.findByID({
      collection: 'users',
      id: customerId,
      depth: 0,
      overrideAccess: true,
    })
    if (customer?.email) data.email = customer.email
  } catch {
    // Leave data.email unset — the field's own validation will surface the problem clearly.
  }

  return data
}
