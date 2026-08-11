import * as React from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface BreadcrumbItemData {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItemData[]
  className?: string
  /** Collapse the middle of a long trail on small screens, keeping first/last visible. */
  truncateOnMobile?: boolean
}

export function Breadcrumb({ items, className, truncateOnMobile = true }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-pmc-ink-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isMiddle = index > 0 && !isLast
          return (
            <li
              key={`${item.label}-${index}`}
              className={cn(
                'flex items-center gap-1.5',
                truncateOnMobile && isMiddle && 'hidden sm:flex',
              )}
            >
              {index > 0 && <ChevronRight className="size-3.5 text-pmc-ink-300" aria-hidden="true" />}
              {item.href && !isLast ? (
                <a href={item.href} className="max-w-[10rem] truncate hover:text-pmc-blue-700 hover:underline">
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn('max-w-[12rem] truncate', isLast && 'font-medium text-pmc-ink-800')}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
