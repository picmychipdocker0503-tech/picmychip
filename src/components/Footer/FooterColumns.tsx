import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { getFooterColumnIcon } from '@/utilities/getFooterColumnIcon'
import { getFooterLinkIcon } from '@/utilities/getFooterLinkIcon'
import { ChevronRight } from 'lucide-react'
import React from 'react'

type Props = {
  columns: Footer['columns']
}

// Tailwind needs literal class names to pick them up at build time, so the
// column count -> grid-cols mapping is spelled out rather than interpolated.
const GRID_COLS_BY_COUNT: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

export const FooterColumns: React.FC<Props> = ({ columns }) => {
  if (!columns?.length) return null

  const gridColsClass = GRID_COLS_BY_COUNT[Math.min(columns.length, 4)] ?? 'sm:grid-cols-4'

  return (
    <div className={`grid flex-1 grid-cols-2 gap-8 ${gridColsClass}`}>
      {columns.map((column, index) => {
        const Icon = getFooterColumnIcon(column.title ?? '')

        return (
          <div key={column.id ?? index}>
            <h3 className="text-muted-foreground mb-5 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
              <Icon className="size-3.5" />
              {column.title}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {(column.links ?? []).map((item, linkIndex) => {
                const label = item.link?.label ?? ''
                const LinkIcon = getFooterLinkIcon(label)

                return (
                  <li key={item.id ?? linkIndex}>
                    <CMSLink
                      appearance="link"
                      className="group text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
                      {...item.link}
                      label={undefined}
                    >
                      <LinkIcon className="text-primary/60 group-hover:text-primary size-3.5 shrink-0" />
                      <span>{label}</span>
                      <ChevronRight className="text-muted-foreground/50 group-hover:text-primary size-3 shrink-0 transition-all group-hover:translate-x-0.5" />
                    </CMSLink>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
