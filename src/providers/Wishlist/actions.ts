'use server'

import type { Product } from '@/payload-types'

import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

const getCurrentUser = async () => {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  return { payload, user }
}

/** Product IDs (as strings, matching the client-side wishlist API) saved to the signed-in user's server wishlist. Empty for guests. */
export async function getWishlistProductIds(): Promise<string[]> {
  const { payload, user } = await getCurrentUser()
  if (!user) return []

  const { docs } = await payload.find({
    collection: 'wishlists',
    where: { customer: { equals: user.id } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })

  return docs.map((entry) => String(typeof entry.product === 'object' ? entry.product.id : entry.product))
}

/**
 * Adds the product if it isn't already saved, removes it if it is. No-op
 * (returns `saved: false`) for guests — the client falls back to
 * localStorage for anonymous wishlists.
 */
export async function toggleWishlistItem(productId: string): Promise<{ saved: boolean }> {
  const { payload, user } = await getCurrentUser()
  if (!user) return { saved: false }

  const { docs: existing } = await payload.find({
    collection: 'wishlists',
    where: { and: [{ customer: { equals: user.id } }, { product: { equals: productId } }] },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  if (existing.length > 0) {
    await payload.delete({ collection: 'wishlists', id: existing[0].id, overrideAccess: true })
    return { saved: false }
  }

  await payload.create({
    collection: 'wishlists',
    data: { customer: user.id, product: Number(productId) },
    overrideAccess: true,
  })
  return { saved: true }
}

/** Adds any local-only IDs (from a guest session) to the server wishlist on login — merge, not replace. */
export async function mergeLocalWishlistIntoServer(localIds: string[]): Promise<string[]> {
  const { payload, user } = await getCurrentUser()
  if (!user || localIds.length === 0) return getWishlistProductIds()

  const { docs: existing } = await payload.find({
    collection: 'wishlists',
    where: { customer: { equals: user.id } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })
  const existingProductIds = new Set(
    existing.map((entry) => String(typeof entry.product === 'object' ? entry.product.id : entry.product)),
  )

  const toAdd = localIds.filter((id) => !existingProductIds.has(id))

  for (const productId of toAdd) {
    await payload.create({
      collection: 'wishlists',
      data: { customer: user.id, product: Number(productId) },
      overrideAccess: true,
    })
  }

  return getWishlistProductIds()
}

/**
 * Full product docs for the wishlist page — via the local API rather than
 * `/api/products`, which is shadowed by a custom search route
 * (src/app/(app)/api/products/route.ts) that only understands
 * q/sort/category/page params and silently ignores `where[id][in]`,
 * returning an unrelated default listing instead of erroring.
 */
export async function getWishlistProducts(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    limit: ids.length,
    overrideAccess: false,
    where: { id: { in: ids.map(Number) } },
  })

  return docs
}

export async function clearWishlist(): Promise<void> {
  const { payload, user } = await getCurrentUser()
  if (!user) return

  const { docs } = await payload.find({
    collection: 'wishlists',
    where: { customer: { equals: user.id } },
    depth: 0,
    limit: 500,
    overrideAccess: true,
  })

  for (const entry of docs) {
    await payload.delete({ collection: 'wishlists', id: entry.id, overrideAccess: true })
  }
}
