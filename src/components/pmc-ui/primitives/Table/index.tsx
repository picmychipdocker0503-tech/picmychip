import * as React from 'react'

import { cn } from '@/components/pmc-ui/lib/cn'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-pmc-slate-200">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  )
}

export function TableHead({ className, sticky, ...props }: React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }) {
  return (
    <thead
      className={cn(
        'bg-pmc-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-pmc-ink-500',
        sticky && 'sticky top-0 z-10',
        className,
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-pmc-slate-100', className)} {...props} />
}

export function TableRow({
  className,
  zebra,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { zebra?: boolean }) {
  return (
    <tr
      className={cn('transition-colors hover:bg-pmc-blue-50/40', zebra && 'even:bg-pmc-slate-50/60', className)}
      {...props}
    />
  )
}

export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('whitespace-nowrap px-4 py-3', className)} {...props} />
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-pmc-ink-800', className)} {...props} />
}
