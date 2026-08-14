import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/**
 * Gives the Testimonials block's heading a dash so the new two-tone
 * (bold-dark / muted-gray continuation) heading style actually renders —
 * the component splits at an em/en dash if present, otherwise falls back
 * to one solid-color line.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1, depth: 0 })
  const home = docs[0]
  if (!home) throw new Error('home page not found')

  const layout = home.layout ?? []
  const index = layout.findIndex((block: any) => block.blockType === 'testimonials')
  if (index === -1) {
    payload.logger.info('No testimonials block found on home page — nothing to do.')
    process.exit(0)
  }

  const nextLayout = [...layout]
  nextLayout[index] = { ...(layout[index] as any), heading: 'What Our Customers Say — And Keep Coming Back.' }

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { layout: nextLayout },
    context: { disableRevalidate: true },
  })

  payload.logger.info('Updated testimonials heading.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
