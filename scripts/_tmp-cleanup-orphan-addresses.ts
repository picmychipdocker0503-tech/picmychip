import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  for (const id of [20, 19, 14, 13, 12, 11]) {
    const addr = await payload.findByID({ collection: 'addresses', id, depth: 0, overrideAccess: true }).catch(() => null)
    if (addr && addr.customer === null) {
      await payload.delete({ collection: 'addresses', id, overrideAccess: true })
      console.log('deleted orphan address', id)
    } else {
      console.log('skip', id, '- not null-customer or not found')
    }
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
