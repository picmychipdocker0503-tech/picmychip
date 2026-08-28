import type { Payload } from 'payload'

import type { ParsedRow } from './parseAndValidate'

import { fetchFileByURL } from './fetchFileByURL'

export type CommitResult = {
  created: number
  updated: number
  failed: { rowNumber: number; title?: string; error: string }[]
}

export async function commitBulkProducts(payload: Payload, rows: ParsedRow[]): Promise<CommitResult> {
  const result: CommitResult = { created: 0, updated: 0, failed: [] }

  for (const row of rows) {
    if (row.action === 'error' || !row.data) continue

    try {
      const data: Record<string, unknown> = { ...row.data }

      if (row.imageUrls.length > 0) {
        const gallery: { image: number }[] = []
        for (const url of row.imageUrls) {
          const file = await fetchFileByURL(url)
          const media = await payload.create({
            collection: 'media',
            data: { alt: (data.title as string) || row.title || 'Product image' },
            file,
            overrideAccess: true,
          })
          gallery.push({ image: media.id })
        }
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
