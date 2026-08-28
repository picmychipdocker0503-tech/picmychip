import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  const slugs = ['how-we-source-and-vet-components', 'inside-our-qc-process', 'life-on-the-picmychip-team', 'mistakes-first-time-makers-make']
  for (const slug of slugs) {
    const { docs } = await payload.find({ collection: 'guides', where: { slug: { equals: slug } }, overrideAccess: true, depth: 0 })
    const g = docs[0]
    console.log(slug, '->', g ? { id: g.id, status: g._status, title: g.title, metaRobotsNoIndex: g.meta } : 'NOT FOUND')
  }
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
