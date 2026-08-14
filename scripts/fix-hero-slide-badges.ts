import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Two slide-badge inconsistencies on the home hero carousel:
 * - Slide 1 ("Modules & Interface Boards") has no badge at all, so the
 *   heading jumps up when the carousel lands on it — every other slide has
 *   one, which pushes the heading down by a consistent amount.
 * - Slide 3's badge literally reads "Spec-Verified", which now duplicates
 *   the "Spec-Verified" trust chip rendered in every slide's content (added
 *   when the hero badges were integrated into the flow instead of floating
 *   over the product image).
 */
const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 0 })
  const home = docs[0]
  if (!home) throw new Error('home page not found')

  const layout = home.layout ?? []
  const heroIndex = layout.findIndex((block: any) => block.blockType === 'heroCarousel')
  if (heroIndex === -1) throw new Error('heroCarousel block not found on home page')

  const heroCarousel = layout[heroIndex] as any
  const slides = heroCarousel.slides ?? []

  if (!slides[1] || !slides[3]) {
    payload.logger.info('Expected slide indexes not found — nothing to do.')
    process.exit(0)
  }

  slides[1] = { ...slides[1], badge: 'Featured' }
  slides[3] = { ...slides[3], badge: 'In Stock Now' }

  const nextLayout = [...layout]
  nextLayout[heroIndex] = { ...heroCarousel, slides }

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { layout: nextLayout },
    context: { disableRevalidate: true },
  })

  payload.logger.info('Updated hero slide badges: slide[1] -> "Featured", slide[3] -> "In Stock Now".')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
