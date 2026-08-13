import { getPayload } from 'payload'
import configPromise from './src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const { docs } = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'home' } },
  depth: 1,
  limit: 1,
})
const home = docs[0]
if (!home) {
  console.log('No "home" page doc found — likely using homeStaticData fallback in code.')
  process.exit(0)
}

const heroBlock = home.layout?.find((b) => b.blockType === 'heroCarousel')
console.log('heroCarousel block found:', Boolean(heroBlock))
console.log('slide count:', heroBlock?.slides?.length)
for (const s of heroBlock?.slides ?? []) {
  console.log('-', s.heading, '| layout:', s.layout, '| image:', typeof s.image === 'object' ? s.image?.url : s.image)
}
process.exit(0)
