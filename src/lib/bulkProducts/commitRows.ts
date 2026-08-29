import type { Payload } from 'payload'

import type { ParsedRow } from './parseAndValidate'

import { altFromFilename } from '@/utilities/altFromFilename'
import { getServerSideURL } from '@/utilities/getURL'

import { fetchFileByURL } from './fetchFileByURL'

export type CommitResult = {
  created: number
  updated: number
  unchanged: number
  failed: { rowNumber: number; title?: string; error: string }[]
}

const toAbsoluteURL = (url: string, baseUrl: string): string => (/^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`)

export async function commitBulkProducts(payload: Payload, rows: ParsedRow[]): Promise<CommitResult> {
  const result: CommitResult = { created: 0, updated: 0, unchanged: 0, failed: [] }
  const baseUrl = getServerSideURL()

  // --- Pre-fetch current galleries for update rows carrying image URLs —
  // the exported sheet round-trips each product's own current image URL, so
  // most "update" rows re-list the exact same image that's already there.
  // Without this, every import run re-downloads and re-processes (WebP
  // re-encode + resize) every image on every row, even when nothing about
  // the image actually changed — this is what made a 257-row import take
  // 10+ minutes. Matching URLs reuse the existing Media id instead. ---
  const updateIdsWithImages = rows
    .filter((row): row is ParsedRow & { productId: number } => row.action === 'update' && Boolean(row.productId) && row.imageUrls.length > 0)
    .map((row) => row.productId)

  const existingGalleryByProductId = new Map<number, Map<string, number>>()
  if (updateIdsWithImages.length > 0) {
    const { docs } = await payload.find({
      collection: 'products',
      depth: 1,
      limit: updateIdsWithImages.length,
      overrideAccess: true,
      pagination: false,
      select: { gallery: true },
      where: { id: { in: updateIdsWithImages } },
    })
    for (const doc of docs) {
      const urlToId = new Map<string, number>()
      for (const item of doc.gallery || []) {
        if (typeof item.image === 'object' && item.image?.url) {
          urlToId.set(toAbsoluteURL(item.image.url, baseUrl), item.image.id)
        }
      }
      existingGalleryByProductId.set(doc.id, urlToId)
    }
  }

  for (const row of rows) {
    if (row.action === 'error' || !row.data) continue

    if (row.action === 'unchanged') {
      result.unchanged += 1
      continue
    }

    try {
      const data: Record<string, unknown> = { ...row.data }

      if (row.imageUrls.length > 0) {
        const existingGallery = row.productId ? existingGalleryByProductId.get(row.productId) : undefined

        // Downloads/uploads within a row run in parallel (order is preserved
        // by Promise.all regardless of finish order, so the first URL stays
        // the primary image) — rows themselves still commit sequentially,
        // which is what actually needs to stay safe for DB writes.
        const gallery = await Promise.all(
          row.imageUrls.map(async (url) => {
            const existingId = existingGallery?.get(url)
            if (existingId) return { image: existingId }

            const file = await fetchFileByURL(url)
            const alt = altFromFilename(file.name) || (data.title as string) || row.title || 'Product image'
            const media = await payload.create({
              collection: 'media',
              data: { alt },
              file,
              overrideAccess: true,
            })
            return { image: media.id }
          }),
        )
        data.gallery = gallery
      }

      if (row.action === 'update' && row.productId) {
        await payload.update({ collection: 'products', id: row.productId, data, overrideAccess: true })
        result.updated += 1
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - dynamically-assembled import data doesn't match Payload's strict generated type, same as RenderBlocks
        await payload.create({ collection: 'products', data, overrideAccess: true })
        result.created += 1
      }
    } catch (err) {
      result.failed.push({
        rowNumber: row.rowNumber,
        title: row.title,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return result
}
