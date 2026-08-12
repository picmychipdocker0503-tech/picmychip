import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// One-off: the Home page's hero carousel had one slide on `layout: 'fullBleed'`
// and one on `layout: 'split'`, producing two visually inconsistent hero
// banners. Standardizing both on 'split' per user request.
const run = async () => {
  const payload = await getPayload({ config })

  const page = await payload.findByID({ collection: 'pages', id: 3, overrideAccess: true })
  const blocks = (page.layout ?? []) as unknown as Array<Record<string, unknown>>

  let changed = false
  const newBlocks = blocks.map((block) => {
    if (block.blockType !== 'heroCarousel') return block
    const slides = (block.slides ?? []) as Array<Record<string, unknown>>
    const newSlides = slides.map((slide) => {
      if (slide.layout !== 'split') {
        changed = true
        return { ...slide, layout: 'split' }
      }
      return slide
    })
    return { ...block, slides: newSlides }
  })

  if (!changed) {
    payload.logger.info('No slides needed changing.')
    process.exit(0)
  }

  await payload.update({
    collection: 'pages',
    id: 3,
    data: { layout: newBlocks },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  payload.logger.info('Updated Home page hero carousel: all slides now use layout=split.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
