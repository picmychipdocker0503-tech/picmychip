import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PriceFacetClient } from './PriceFacet.client'

export async function PriceFacet() {
  const payload = await getPayload({ config: configPromise })

  const [lowest, highest] = await Promise.all([
    payload.find({
      collection: 'products',
      limit: 1,
      sort: 'priceInINR',
      where: { _status: { equals: 'published' }, priceInINR: { exists: true } },
      select: { priceInINR: true },
    }),
    payload.find({
      collection: 'products',
      limit: 1,
      sort: '-priceInINR',
      where: { _status: { equals: 'published' }, priceInINR: { exists: true } },
      select: { priceInINR: true },
    }),
  ])

  const min = lowest.docs[0]?.priceInINR ?? 0
  const max = highest.docs[0]?.priceInINR ?? 0

  if (min >= max) return null

  return <PriceFacetClient max={Math.ceil(max)} min={Math.floor(min)} />
}
