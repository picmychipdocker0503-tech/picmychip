import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const run = async () => {
  const payload = await getPayload({ config })
  const header = await payload.findGlobal({ slug: 'header', depth: 0, overrideAccess: true })
  console.log('NAV ITEMS', JSON.stringify((header as any).navItems, null, 2))
  process.exit(0)
}
run().catch((e) => { console.error('ERR', e); process.exit(1) })
