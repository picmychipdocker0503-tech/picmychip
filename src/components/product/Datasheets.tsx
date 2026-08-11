import type { Datasheet, Product } from '@/payload-types'

import { FileTextIcon } from 'lucide-react'

type Props = {
  product: Product
}

const formatFilesize = (bytes: number | null | undefined) => {
  if (!bytes) return undefined
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export const Datasheets: React.FC<Props> = ({ product }) => {
  const datasheets = (product.datasheets ?? []).filter(
    (doc): doc is Datasheet => typeof doc === 'object' && Boolean(doc?.url),
  )

  if (!datasheets.length) return null

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">Datasheets</h2>
      <ul className="flex flex-col gap-2">
        {datasheets.map((doc) => (
          <li key={doc.id}>
            <a
              href={doc.url!}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="text-primary hover:underline inline-flex items-center gap-2"
            >
              <FileTextIcon className="size-4" />
              {doc.title || doc.filename}
              {formatFilesize(doc.filesize) && (
                <span className="text-muted-foreground text-sm">({formatFilesize(doc.filesize)})</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
