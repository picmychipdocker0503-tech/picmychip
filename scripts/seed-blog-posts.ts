import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

import {
  makerMistakesPostData,
  qaProcessPostData,
  sourcingPostData,
  teamCulturePostData,
} from '../src/endpoints/seed/blog-posts'

/**
 * Additive-only script: creates/updates a set of author-bylined blog posts
 * in the `guides` collection (same content engine as the technical guides —
 * distinguished on /blog by having `authorName` set). Never touches
 * products, orders, pages, or any other collection — safe to run against a
 * database with real catalog data, and safe to re-run.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const upsertGuide = async (data: ReturnType<typeof makerMistakesPostData>) => {
    const { docs } = await payload.find({
      collection: 'guides',
      where: { slug: { equals: data.slug } },
      limit: 1,
    })

    if (docs[0]) {
      payload.logger.info(`Updating post "${data.slug}"...`)
      return payload.update({
        collection: 'guides',
        id: docs[0].id,
        data,
        context: { disableRevalidate: true },
      })
    }

    payload.logger.info(`Creating post "${data.slug}"...`)
    return payload.create({
      collection: 'guides',
      data,
      context: { disableRevalidate: true },
    })
  }

  await upsertGuide(makerMistakesPostData())
  await upsertGuide(qaProcessPostData())
  await upsertGuide(teamCulturePostData())
  await upsertGuide(sourcingPostData())

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
