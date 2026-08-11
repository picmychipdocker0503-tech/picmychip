import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

import {
  capacitorGuideData,
  connectorGuideData,
  diodeGuideData,
  inductorGuideData,
  resistorGuideData,
} from '../src/endpoints/seed/guide-posts'

/**
 * Additive-only script: creates/updates a set of electronics-component blog
 * posts in the `guides` collection (the site's existing blog/tutorial
 * system). Never touches products, orders, pages, or any other collection —
 * safe to run against a database with real catalog data, and safe to re-run.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const findCategoryId = async (slug: string) => {
    const { docs } = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 })
    return docs[0]?.id
  }

  const categoryIds = {
    capacitor: await findCategoryId('capacitor'),
    connectors: await findCategoryId('connectors'),
    diode: await findCategoryId('diode'),
    inductor: await findCategoryId('inductor'),
    resistor: await findCategoryId('resistor'),
  }

  const upsertGuide = async (data: ReturnType<typeof resistorGuideData>) => {
    const { docs } = await payload.find({
      collection: 'guides',
      where: { slug: { equals: data.slug } },
      limit: 1,
    })

    if (docs[0]) {
      payload.logger.info(`Updating guide "${data.slug}"...`)
      return payload.update({
        collection: 'guides',
        id: docs[0].id,
        data,
        context: { disableRevalidate: true },
      })
    }

    payload.logger.info(`Creating guide "${data.slug}"...`)
    return payload.create({
      collection: 'guides',
      data,
      context: { disableRevalidate: true },
    })
  }

  await upsertGuide(resistorGuideData(categoryIds))
  await upsertGuide(capacitorGuideData(categoryIds))
  await upsertGuide(diodeGuideData(categoryIds))
  await upsertGuide(inductorGuideData(categoryIds))
  await upsertGuide(connectorGuideData(categoryIds))

  payload.logger.info('Done.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
