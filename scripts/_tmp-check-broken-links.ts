import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  // Does anything reference the draft product (id=251, "638190000") via relatedProducts/compatibleProducts?
  const { docs: referencing } = await payload.find({
    collection: 'products',
    where: { or: [{ relatedProducts: { equals: 251 } }, { compatibleProducts: { equals: 251 } }] },
    overrideAccess: true,
    depth: 0,
  })
  console.log('Products referencing draft id=251 via relatedProducts/compatibleProducts:', referencing.length)
  for (const d of referencing) console.log({ id: d.id, title: d.title, slug: d.slug, relatedProducts: d.relatedProducts, compatibleProducts: d.compatibleProducts })

  // Check the two specific flagged product pages directly
  for (const slug of ['radiolink-at10-ii-2-4ghz-12ch-rc-drone-remote-with-prm-01-transmitter-and-r12ds-receiver', 't-motor-antigravity-mn2806-400kv']) {
    const { docs } = await payload.find({ collection: 'products', where: { slug: { equals: slug } }, overrideAccess: true, depth: 0 })
    const p = docs[0]
    console.log('\n---', slug, '---')
    if (!p) { console.log('NOT FOUND'); continue }
    console.log({ id: p.id, title: p.title, relatedProducts: p.relatedProducts, compatibleProducts: p.compatibleProducts, datasheets: p.datasheets, galleryCount: p.gallery?.length })
  }

  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
