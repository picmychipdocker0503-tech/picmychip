import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * The homepage renders the hardcoded `FeaturedCategories` component (nicer
 * purple icon-card design, with a subtitle + "View all categories" link)
 * AND a CMS `categoryGrid` block with the exact same 8 category slugs in the
 * exact same order (orange gradient tiles) — a straight duplicate section.
 * Removes the redundant categoryGrid block from the home page's layout.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 0 })
  const home = docs[0]
  if (!home) throw new Error('home page not found')

  const layout = home.layout ?? []
  const nextLayout = layout.filter((block: any) => block.blockType !== 'categoryGrid')

  if (nextLayout.length === layout.length) {
    payload.logger.info('No categoryGrid block found on home page — nothing to do.')
    process.exit(0)
  }

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { layout: nextLayout },
    context: { disableRevalidate: true },
  })

  payload.logger.info(`Removed duplicate categoryGrid block. Layout now has ${nextLayout.length} blocks.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
