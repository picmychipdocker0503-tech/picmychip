'use client'
import React, { useCallback, useMemo } from 'react'

import { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'

type Props = {
  category: Category
  count?: number
}

export const CategoryItem: React.FC<Props> = ({ category, count }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [category.id, isActive, pathname, router, searchParams])

  return (
    <button
      className={clsx('flex w-full items-center justify-between text-left', { 'menu-active': isActive })}
      onClick={() => setQuery()}
      type="button"
    >
      {category.title}
      {typeof count === 'number' && <span className="text-muted-foreground text-xs">{count}</span>}
    </button>
  )
}
