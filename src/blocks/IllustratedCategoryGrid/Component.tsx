import type { Category, IllustratedCategoryGridBlock as IllustratedCategoryGridBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import { getIllustration } from '@/components/illustrations'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

export const IllustratedCategoryGridBlock: React.FC<
  IllustratedCategoryGridBlockProps & {
    id?: string | number
    className?: string
  }
> = async ({ heading, categories }) => {
  const ids = (categories ?? []).map((category) => (typeof category === 'object' ? category.id : category))

  if (ids.length === 0) return null

  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'categories',
    depth: 0,
    where: { id: { in: ids } },
  })

  const orderedCategories = ids
    .map((id) => docs.find((doc) => doc.id === id))
    .filter((doc): doc is Category => Boolean(doc))

  return (
    <div className="container my-12">
      {heading && <h2 className="mb-6 text-3xl font-bold text-foreground">{heading}</h2>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {orderedCategories.map((category) => {
          const Illustration = getIllustration(category.specSchemaType)
          return (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Card className="h-full items-center gap-3 py-8 text-center transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br from-orange to-orange-light border-orange/20">
                <CardContent className="flex flex-col items-center gap-4 px-4">
                  <div className="bg-white rounded-full p-4 shadow-sm">
                    <Illustration className="text-orange size-12" />
                  </div>
                  <CardTitle className="text-foreground font-semibold">{category.title}</CardTitle>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
