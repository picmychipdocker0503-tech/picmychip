import { getPayload } from 'payload'
import config from '@payload-config'

import { getMeiliClient, PRODUCTS_INDEX } from '@/lib/meilisearch'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { configureProductsIndex, toSearchDocument } from '@/lib/searchIndex'
import { isValidSecret } from '@/lib/verifySecret'

const BATCH_SIZE = 200

export async function POST(request: Request): Promise<Response> {
  const ip = getClientIp(request.headers)
  const { allowed } = checkRateLimit(`search-reindex:${ip}`, 10, 60_000)
  if (!allowed) {
    return new Response('Too many requests.', { status: 429 })
  }

  const secret = request.headers.get('x-reindex-secret')

  if (!isValidSecret(secret, process.env.REINDEX_SECRET)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  const payload = await getPayload({ config })

  try {
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
        await index.addDocuments(result.docs.map(toSearchDocument))
        synced += result.docs.length
      }

      hasNextPage = result.hasNextPage
      page += 1
    }

    return Response.json({ success: true, synced })
  } catch (error) {
    payload.logger.error({ err: error, message: 'Error reindexing products' })
    return new Response('Error reindexing products.', { status: 500 })
  }
}
