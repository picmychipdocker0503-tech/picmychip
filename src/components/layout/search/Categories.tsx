import configPromise from '@payload-config'
import { getPayload } from 'payload'
import clsx from 'clsx'
import React, { Suspense } from 'react'

import { CategoryItem } from './Categories.client'
import { sortCategoriesBySequence } from '@/utilities/categoryOrdering'

async function CategoryList() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    limit: 200,
    sort: 'title',
  })
  const orderedCategories = sortCategoriesBySequence(
    categories.docs.filter((category) => category.slug !== 'shop' && category.slug !== 'components'),
  )

  const counts = await Promise.all(
    orderedCategories.map((category) =>
      payload.count({
        collection: 'products',
        where: {
          and: [{ _status: { equals: 'published' } }, { categories: { contains: category.id } }],
        },
      }),
    ),
  )

  return (
    <details className="group" open>
      <summary className="marker:content-none flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
        Category
        <svg
          className="size-4 transition-transform group-open:-rotate-180"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <ul className="menu mt-2 w-full p-0">
        {orderedCategories.map((category, index) => (
          <li key={category.id}>
            <CategoryItem category={category} count={counts[index]?.totalDocs ?? 0} />
          </li>
        ))}
      </ul>
    </details>
  )
}

const skeleton = 'mb-3 h-4 w-5/6 animate-pulse rounded'
const activeAndTitles = 'bg-neutral-800 dark:bg-neutral-300'
const items = 'bg-neutral-400 dark:bg-neutral-700'

export function Categories() {
  return (
    <Suspense
      fallback={
        <div className="col-span-2 hidden h-[400px] w-full flex-none py-4 lg:block">
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, activeAndTitles)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
          <div className={clsx(skeleton, items)} />
        </div>
      }
    >
      <CategoryList />
    </Suspense>
  )
}
