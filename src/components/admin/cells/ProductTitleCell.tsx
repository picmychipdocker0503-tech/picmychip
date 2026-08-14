import type { DefaultCellComponentProps } from 'payload'

import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

/**
 * Custom Cell for the Products list's `title` column — combines a thumbnail,
 * title, and SKU into one row. `rowData` only carries fields backed by an
 * active list column (Payload's list view builds its query `select` from
 * visible columns, not `defaultPopulate` — see transformColumnsToSelect in
 * @payloadcms/next), so `gallery`/`sku` aren't reliably present on rowData
 * unless they're also columns. Fetching them directly by id here is a small
 * bounded query (one per visible row, ~10-25/page) rather than fighting that
 * column-select mechanism. Still a real link to the edit view, so row
 * navigation keeps working exactly as before.
 */
export const ProductTitleCell: React.FC<DefaultCellComponentProps> = async ({ rowData, collectionSlug }) => {
  const title = (rowData?.title as string) || 'Untitled'
  const id = rowData?.id as number | string | undefined

  let imageUrl: string | undefined
  let sku: string | undefined

  if (id) {
    const payload = await getPayload({ config: configPromise })
    const doc = await payload
      .findByID({
        collection: 'products',
        id,
        depth: 1,
        select: { gallery: true, sku: true, slug: true },
      })
      .catch(() => null)

    const image = doc?.gallery?.[0]?.image
    imageUrl = image && typeof image === 'object' && 'url' in image ? (image.url ?? undefined) : undefined
    sku = doc?.sku || doc?.slug || undefined
  }

  return (
    <Link className="flex items-center gap-3 no-underline" href={`/admin/collections/${collectionSlug}/${id}`}>
      <span className="bg-base-200 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="size-full object-contain" src={imageUrl} />
        ) : (
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="14">
            <path
              d="M4 16L8.586 11.414A2 2 0 0111.414 11.414L16 16M14 14L15.586 12.414A2 2 0 0118.414 12.414L20 14M14 8H14.01M6 20H18A2 2 0 0020 18V6A2 2 0 0018 4H6A2 2 0 004 6V18A2 2 0 006 20Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-base-content/25"
            />
          </svg>
        )}
      </span>
      <span className="flex flex-col">
        <span className="text-base-content font-medium">{title}</span>
        <span className="text-base-content/50 text-xs">{sku || '—'}</span>
      </span>
    </Link>
  )
}
