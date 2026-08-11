import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  siblingCount?: number
}

function getPageList(page: number, totalPages: number, siblingCount: number): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 5
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(page - siblingCount, 1)
  const rightSibling = Math.min(page + siblingCount, totalPages)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  const pages: (number | 'ellipsis')[] = [1]
  if (showLeftEllipsis) pages.push('ellipsis')
  for (let p = Math.max(leftSibling, 2); p <= Math.min(rightSibling, totalPages - 1); p++) {
    pages.push(p)
  }
  if (showRightEllipsis) pages.push('ellipsis')
  if (totalPages > 1) pages.push(totalPages)
  return pages
}

export function Pagination({ page, totalPages, onPageChange, className, siblingCount = 1 }: PaginationProps) {
  const pages = getPageList(page, totalPages, siblingCount)

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex size-9 items-center justify-center rounded-md text-pmc-ink-600 hover:bg-pmc-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-pmc-focus"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {pages.map((p, index) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex size-9 items-center justify-center text-pmc-ink-400"
            aria-hidden="true"
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-md text-sm font-medium focus-visible:outline-none focus-visible:shadow-pmc-focus',
              p === page
                ? 'bg-pmc-blue-600 text-white'
                : 'text-pmc-ink-700 hover:bg-pmc-slate-100',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex size-9 items-center justify-center rounded-md text-pmc-ink-600 hover:bg-pmc-slate-100 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-pmc-focus"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
