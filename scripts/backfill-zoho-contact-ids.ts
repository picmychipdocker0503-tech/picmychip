import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { zohoFetch, zohoIsConfigured } from '../src/lib/zoho/auth'
import type { ZohoContact } from '../src/lib/zoho/types'

const normalize = (v?: string | null) => (v || '').trim().toLowerCase()

function contactEmails(contact: ZohoContact): string[] {
  const rootEmail = (contact as ZohoContact & { email?: string }).email
  return [rootEmail, ...(contact.contact_persons?.map((p) => p.email) ?? [])].map(normalize).filter(Boolean)
}

// One-time backfill for the account-level zohoCustomerId dedup fix: every
// existing customer who was already synced to Zoho before this fix has that
// history recorded on their own past orders (order.zohoCustomerId), but
// never had it copied onto their own users record — so their very next
// order sync would re-run the search-then-maybe-create path from scratch.
//
// Every candidate — whether sourced from an order or from a live email
// search — is verified against the Zoho contact's own registered email
// before being trusted. This is not optional: Zoho's `/contacts?email=`
// filter does not reliably filter in practice (confirmed live, it can
// return the org's entire contact list regardless of the value queried),
// and pre-fix orders can themselves already carry a wrong zohoCustomerId
// from the exact bug this backfill exists to clean up after — copying that
// forward unverified would cement the corruption onto the account instead
// of fixing it. Anything that doesn't verify is logged, never guessed.
//
// Safe to re-run — every write is conditional on zohoCustomerId still being
// empty.
const run = async () => {
  const payload = await getPayload({ config })

  const { docs: customers } = await payload.find({
    collection: 'users',
    limit: 0,
    depth: 0,
    overrideAccess: true,
    where: {
      or: [{ zohoCustomerId: { equals: '' } }, { zohoCustomerId: { exists: false } }],
    },
  })

  payload.logger.info(`Found ${customers.length} customer(s) with no zohoCustomerId on file.`)

  let backfilledFromOrders = 0
  let backfilledFromEmailSearch = 0
  let skippedUnverified = 0
  let skippedAmbiguous = 0
  let skippedNoData = 0

  for (const customer of customers) {
    if (!customer.email) {
      skippedNoData++
      continue
    }
    const customerEmail = normalize(customer.email)

    const { docs: syncedOrders } = await payload.find({
      collection: 'orders',
      limit: 1,
      depth: 0,
      overrideAccess: true,
      where: {
        customer: { equals: customer.id },
        zohoCustomerId: { exists: true },
      },
    })

    const contactIdFromOrder = syncedOrders[0]?.zohoCustomerId

    if (contactIdFromOrder) {
      try {
        const { contact } = await zohoFetch<{ contact: ZohoContact }>(`/contacts/${contactIdFromOrder}`)
        if (contactEmails(contact).includes(customerEmail)) {
          await payload.update({
            collection: 'users',
            id: customer.id,
            data: { zohoCustomerId: contactIdFromOrder },
            overrideAccess: true,
            context: { disableRevalidate: true },
          })
          payload.logger.info(`Customer ${customer.id} (${customer.email}): backfilled ${contactIdFromOrder} from order ${syncedOrders[0].id}.`)
          backfilledFromOrders++
          continue
        }
        payload.logger.warn(
          `Customer ${customer.id} (${customer.email}): order ${syncedOrders[0].id} carries zohoCustomerId ${contactIdFromOrder} ("${contact.contact_name}"), but that contact's own email doesn't match — likely pre-existing misattribution. Skipped, needs manual review.`,
        )
        skippedUnverified++
        continue
      } catch {
        // Stale/deleted contact id on the order — falls through to email search below.
      }
    }

    if (!zohoIsConfigured) {
      skippedNoData++
      continue
    }

    const params = new URLSearchParams({ email: customer.email, filter_by: 'Status.All' })
    const { contacts } = await zohoFetch<{ contacts: ZohoContact[] }>(`/contacts?${params.toString()}`)
    const matches = (contacts ?? []).filter((c) => contactEmails(c).includes(customerEmail))

    if (matches.length === 1) {
      await payload.update({
        collection: 'users',
        id: customer.id,
        data: { zohoCustomerId: matches[0].contact_id },
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      payload.logger.info(`Customer ${customer.id} (${customer.email}): backfilled ${matches[0].contact_id} from Zoho email search.`)
      backfilledFromEmailSearch++
    } else if (matches.length > 1) {
      payload.logger.warn(`Customer ${customer.id} (${customer.email}): ${matches.length} Zoho contacts genuinely match this email — skipped, needs manual review.`)
      skippedAmbiguous++
    } else {
      skippedNoData++
    }
  }

  payload.logger.info(
    `Done. Backfilled from orders: ${backfilledFromOrders}. Backfilled from email search: ${backfilledFromEmailSearch}. Unverified/skipped: ${skippedUnverified}. Ambiguous (skipped): ${skippedAmbiguous}. No data to backfill from (skipped): ${skippedNoData}.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
