'use client'

import { Price } from '@/components/Price'
import { useLocale } from '@/providers/Locale'
import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { getClientSideURL } from '@/utilities/getURL'
import { SearchIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
}

type Suggestion = {
  id: number | string
  title: string
  slug: string
  imageUrl?: string
  priceInINR?: number | null
}

export const Search: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()

  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      fetch(`${getClientSideURL()}/api/search/suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setSuggestions(data?.suggestions ?? []))
        .catch(() => {})
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsOpen(false)

    const newParams = new URLSearchParams(searchParams.toString())

    if (query) {
      newParams.set('q', query)
    } else {
      newParams.delete('q')
    }

    router.push(createUrl('/shop', newParams))
  }

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <form
        className="border-border bg-card focus-within:border-primary focus-within:ring-primary/20 relative flex w-full items-center rounded-full border py-1 pr-1 pl-4 transition-all focus-within:ring-2"
        onSubmit={onSubmit}
      >
        <SearchIcon className="text-muted-foreground size-5 shrink-0" />
        <input
          aria-label="Search products"
          autoComplete="off"
          className="text-foreground placeholder:text-muted-foreground w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
          name="search"
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('searchPlaceholder')}
          type="text"
          value={query}
        />
        <button
          className="bg-orange hover:bg-orange/90 shrink-0 rounded-full px-5 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors"
          type="submit"
        >
          Search
        </button>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="border-border bg-card absolute z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-lg">
          {suggestions.map((suggestion) => (
            <Link
              className="hover:bg-muted flex items-center gap-3 px-4 py-2.5 transition-colors"
              href={`/products/${suggestion.slug}`}
              key={suggestion.id}
              onClick={() => setIsOpen(false)}
            >
              <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                {suggestion.imageUrl && (
                  <Image alt={suggestion.title} className="object-cover" fill src={suggestion.imageUrl} />
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium">{suggestion.title}</span>
              {typeof suggestion.priceInINR === 'number' && (
                <Price amount={suggestion.priceInINR} className="text-muted-foreground text-sm" currencyCode="INR" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
