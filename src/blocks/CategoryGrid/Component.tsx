import type { Category, CategoryGridBlock as CategoryGridBlockProps } from '@/payload-types'

import { Media } from '@/components/Media'
import { getIllustration } from '@/components/illustrations'
import { CATEGORY_ICON_MAP } from '@/components/illustrations/categoryIcons'
import Link from 'next/link'
import React from 'react'

export const CategoryGridBlock: React.FC<
  CategoryGridBlockProps & {
    id?: string | number
  }
> = ({ heading, categories }) => {
  const rows = (categories ?? []).filter(
    (row): row is typeof row & { category: Category } => typeof row.category === 'object',
  )

  if (rows.length === 0) return null

  return (
    <div className="container">
      {heading && <h2 className="mb-6 text-2xl font-bold sm:text-3xl">{heading}</h2>}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {rows.map((row, index) => {
          const category = row.category
          const image = typeof row.image === 'object' ? row.image : undefined
          const Icon = CATEGORY_ICON_MAP[category.slug] ?? getIllustration(category.specSchemaType)

          return (
            <Link
              className="group flex w-28 shrink-0 snap-start flex-col items-center gap-2 text-center sm:w-auto"
              href={`/category/${category.slug}`}
              key={row.id ?? index}
            >
              <div className="card-hover from-orange/25 to-orange/10 border-orange/20 relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br">
                {image ? (
                  <Media fill imgClassName="object-cover" resource={image} />
                ) : (
                  <Icon className="text-orange size-12 transition-transform duration-300 group-hover:scale-110" />
                )}
              </div>
              <span className="text-sm font-medium">{category.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
