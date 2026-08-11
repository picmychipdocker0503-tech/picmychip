import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Fixes a bug from an earlier script: fetching the home page without
 * `depth: 0` meant `brandStrip.brands` was already populated as objects,
 * so a `typeof id === 'number'` filter silently dropped the original 6
 * brand IDs when merging in the 2 new ones, leaving only [7, 8].
 */
const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  })
  const home = docs[0]
  if (!home) throw new Error('home page not found')

  const layout = home.layout ?? []
  const brandStripIndex = layout.findIndex((block: any) => block.blockType === 'brandStrip')
  if (brandStripIndex < 0) throw new Error('no brandStrip block found')

  const { docs: allBrands } = await payload.find({ collection: 'brands', limit: 50, depth: 0, sort: 'id' })
  const allIds = allBrands.map((brand) => brand.id)

  const nextLayout = layout.map((block: any, index: number) =>
    index === brandStripIndex ? { ...block, brands: allIds } : block,
  )

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { layout: nextLayout },
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Fixed brandStrip.brands: [${allIds.join(', ')}]`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
