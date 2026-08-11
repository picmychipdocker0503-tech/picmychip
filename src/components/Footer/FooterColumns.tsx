import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import React from 'react'

type Props = {
  columns: Footer['columns']
}

export const FooterColumns: React.FC<Props> = ({ columns }) => {
  if (!columns?.length) return null

  return (
    <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
      {columns.map((column, index) => (
        <div key={column.id ?? index}>
          <h3 className="mb-5 text-xs font-semibold tracking-wider text-neutral-500 uppercase">{column.title}</h3>
          <ul className="flex flex-col gap-2.5">
            {(column.links ?? []).map((item, linkIndex) => (
              <li key={item.id ?? linkIndex}>
                <CMSLink appearance="link" className="text-sm text-neutral-300 transition-colors hover:text-white" {...item.link} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
