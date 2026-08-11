import * as React from 'react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface FeatureGridItem {
  icon: React.ReactNode
  title: string
  description?: string
}

export interface FeatureGridProps {
  items: FeatureGridItem[]
  columns?: 2 | 3 | 4
  className?: string
}

const colsClass: Record<NonNullable<FeatureGridProps['columns']>, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function FeatureGrid({ items, columns = 4, className }: FeatureGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-6', colsClass[columns], className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3 rounded-lg border border-pmc-slate-200 bg-white p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-pmc-blue-50 text-pmc-blue-700">
            {item.icon}
          </span>
          <div>
            <p className="text-sm font-semibold text-pmc-ink-900">{item.title}</p>
            {item.description && <p className="mt-1 text-sm text-pmc-ink-500">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
