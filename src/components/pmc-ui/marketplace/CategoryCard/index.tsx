import * as React from 'react'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { Card } from '@/components/pmc-ui/primitives/Card'

export interface CategoryCardProps {
  title: string
  href: string
  count?: number
  icon?: React.ReactNode
  imageUrl?: string
  className?: string
}

export function CategoryCard({ title, href, count, icon, imageUrl, className }: CategoryCardProps) {
  return (
    <Card hoverable className={cn('group overflow-hidden', className)}>
      <a href={href} className="flex flex-col">
        <div className="flex aspect-[4/3] items-center justify-center bg-pmc-blue-50">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <span className="text-pmc-blue-700 [&_svg]:size-8">{icon}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 p-4">
          <div>
            <p className="text-sm font-semibold text-pmc-ink-900">{title}</p>
            {typeof count === 'number' && <p className="text-xs text-pmc-ink-500">{count} products</p>}
          </div>
          <ArrowRight
            className="size-4 shrink-0 text-pmc-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-pmc-blue-700"
            aria-hidden="true"
          />
        </div>
      </a>
    </Card>
  )
}
