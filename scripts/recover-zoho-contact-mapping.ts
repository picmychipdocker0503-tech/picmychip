import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { findByEmail, getContactIdentityKey } from '../src/lib/zoho/customers'
import { zohoIsConfigured } from '../src/lib/zoho/auth'

/**
 * Recovers customers -> Zoho contact mapping after 20260909_150000's original
 * migration dropped users.zoho_customer_id without preserving it. Never
 * creates anything in Zoho — only looks up each customer's EXISTING contact
 * by email (same matching findOrCreateZohoCustomer already trusts) and
 * backfills users.zohoContacts with what it finds. Customers with no
 * matching contact are left alone; they get one created normally the next
 * time they place an order, same as any first-time customer.
 *
 * Usage:
 *   DATABASE_URL=<production-url> ZOHO_*=<production-creds> npx tsx scripts/recover-zoho-contact-mapping.ts
 *   Add --apply to actually write — without it, this only logs what it would do.
 */
async function main() {
  const apply = process.argv.includes('--apply')

  if (!zohoIsConfigured) {
    console.error('Zoho env vars are not set for this run — aborting.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const { docs: users } = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 0,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { roles: { contains: 'customer' } },
        { email: { exists: true } },
        { or: [{ zohoContacts: { exists: false } }, { 'zohoContacts.identityKey': { exists: false } }] },
      ],
    },
  })

  console.log(`Found ${users.length} customer(s) with no existing zohoContacts entry.`)
  console.log(apply ? 'Running in APPLY mode — will write changes.' : 'Running in DRY-RUN mode — pass --apply to write.')

  let matched = 0
  let unmatched = 0
  let skipped = 0

  for (const user of users) {
    if (Array.isArray(user.zohoContacts) && user.zohoContacts.length > 0) {
      skipped += 1
      continue
    }
    if (!user.email) {
      skipped += 1
      continue
    }

    try {
      const contact = await findByEmail(user.email, false)
      if (!contact) {
        unmatched += 1
        console.log(`  [no match] ${user.email} (user ${user.id})`)
        continue
      }

      const identityKey = getContactIdentityKey(contact)
      matched += 1
      console.log(`  [match] ${user.email} (user ${user.id}) -> contact ${contact.contact_id} (${identityKey})`)

      if (apply) {
        await payload.update({
          collection: 'users',
          id: user.id,
          data: { zohoContacts: [{ identityKey, contactId: contact.contact_id }] },
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
    } catch (err) {
      console.error(`  [error] ${user.email} (user ${user.id}):`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\nDone. matched=${matched} unmatched=${unmatched} skipped=${skipped}`)
  if (!apply) console.log('This was a dry run — re-run with --apply to write these changes.')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
