import type { Datasheet, Product } from '@/payload-types'

import { DownloadIcon, FileTextIcon } from 'lucide-react'

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
    <div className="border-border bg-card rounded-3xl border p-6 sm:p-8">
      <h2 className="mb-5 flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
          <FileTextIcon className="size-4.5" />
        </span>
        <span className="text-xl font-semibold tracking-tight sm:text-2xl">Datasheets</span>
      </h2>
      <ul className="divide-border divide-y">
        {datasheets.map((doc) => (
          <li key={doc.id}>
            <a
              href={doc.url!}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="hover:bg-muted/50 group -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors"
            >
              <span className="border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors">
                <FileTextIcon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="group-hover:text-primary truncate text-sm font-medium transition-colors">
                  {doc.title || doc.filename}
                </span>
                {formatFilesize(doc.filesize) && (
                  <span className="text-muted-foreground text-xs">PDF · {formatFilesize(doc.filesize)}</span>
                )}
              </span>
              <DownloadIcon className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
