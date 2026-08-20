import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Global = keyof Config['globals']

const devGlobalCache = new Map<string, unknown>()

async function getGlobal<T extends Global>(slug: T, depth = 0) {
  const cacheKey = `${slug}:${depth}`
  if (process.env.NODE_ENV !== 'production' && devGlobalCache.has(cacheKey)) {
    return devGlobalCache.get(cacheKey) as Config['globals'][T]
  }

  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
  })

  if (process.env.NODE_ENV !== 'production') devGlobalCache.set(cacheKey, global)
  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) =>
  unstable_cache(async () => getGlobal<T>(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })
