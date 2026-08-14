import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { getMeiliClient, PRODUCTS_INDEX } from '../src/lib/meilisearch'
import { configureProductsIndex, toSearchDocument } from '../src/lib/searchIndex'

// Same logic as src/app/(app)/api/search/reindex/route.ts, run as a
// standalone script so it doesn't depend on a running Next dev server.
const BATCH_SIZE = 200

const run = async () => {
  const payload = await getPayload({ config })

  await configureProductsIndex()
  const index = getMeiliClient().index(PRODUCTS_INDEX)

  let page = 1
  let synced = 0
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'products',
      draft: false,
      overrideAccess: false,
      depth: 1,
      page,
      limit: BATCH_SIZE,
      where: { _status: { equals: 'published' } },
    })

    if (result.docs.length > 0) {
      const task = await index.addDocuments(result.docs.map(toSearchDocument))
      payload.logger.info(`Batch ${page}: submitted ${result.docs.length} docs, task uid=${task.taskUid}`)
      synced += result.docs.length
    }

    hasNextPage = result.hasNextPage
    page += 1
  }

  payload.logger.info(`Done. Submitted ${synced} products for indexing.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
