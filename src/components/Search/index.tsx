'use client'

import { Price } from '@/components/Price'
import { useTranslations } from 'next-intl'
import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { getClientSideURL } from '@/utilities/getURL'
import { ArrowRightIcon, Loader2Icon, PackageSearchIcon, SearchIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  stockStatus?: string | null
  categoryTitle?: string
}

/** Wraps every case-insensitive occurrence of `query` in `<mark>` for scan-ability. */
const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const trimmed = query.trim()
  if (!trimmed) return <>{text}</>

  const parts = text.split(new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark className="bg-primary/20 text-foreground rounded-sm px-0.5" key={i}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  )
}

export const Search: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('search')

  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasSearched = useRef(false)

  useEffect(() => {
    setActiveIndex(-1)

    if (query.trim().length < 2) {
      setSuggestions([])
      setIsLoading(false)
      hasSearched.current = false
      return
    }

    hasSearched.current = false
    setIsLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => {
      fetch(`${getClientSideURL()}/api/search/suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data?.suggestions ?? [])
          setTotalDocs(data?.totalDocs ?? 0)
        })
        .catch(() => {})
        .finally(() => {
          hasSearched.current = true
          setIsLoading(false)
        })
    }, 200)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    // The Header persists across navigations (it isn't remounted per page),
    // so `query` would otherwise keep whatever was last typed forever —
    // clicking a suggestion navigates straight to /products/[slug] without
    // clearing it, and the browser Back button doesn't re-run the useState
    // initializer either. Re-sync from the URL on every route change: empty
    // off /shop entirely, or whatever `q` that particular /shop history
    // entry actually has.
    setQuery(pathname === '/shop' ? searchParams?.get('q') || '' : '')
  }, [pathname, searchParams])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goToShop(q: string) {
    setIsOpen(false)
    const newParams = new URLSearchParams(searchParams.toString())
    if (q) newParams.set('q', q)
    else newParams.delete('q')
    router.push(createUrl('/shop', newParams))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      setIsOpen(false)
      router.push(`/products/${suggestions[activeIndex].slug}`)
      return
    }

    goToShop(query)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const trimmedQuery = query.trim()
  const showDropdown = isOpen && trimmedQuery.length >= 2
  const showNoResults = showDropdown && !isLoading && hasSearched.current && suggestions.length === 0

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <form
        className="border-border bg-card focus-within:border-primary focus-within:ring-primary/15 relative flex w-full items-center rounded-full border py-1 pr-1 pl-4 transition-all duration-300 focus-within:scale-[1.01] focus-within:shadow-lg focus-within:shadow-primary/10 focus-within:ring-4"
        onSubmit={onSubmit}
        role="combobox"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
      >
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          <SearchIcon
            className={cn(
              'text-muted-foreground absolute size-5 transition-all duration-300',
              isLoading ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
            )}
          />
          <Loader2Icon
            className={cn(
              'text-primary absolute size-5 animate-spin transition-all duration-300',
              isLoading ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            )}
          />
        </span>
        <input
          aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="Search products"
          autoComplete="off"
          className="text-foreground placeholder:text-muted-foreground w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
          name="search"
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('searchPlaceholder')}
          type="text"
          value={query}
        />
        <button
          aria-label="Search"
          className="group bg-primary hover:bg-primary/90 text-primary-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95"
          type="submit"
        >
          <SearchIcon className="size-4 transition-transform duration-300 group-hover:rotate-12" />
        </button>
      </form>

      {showDropdown && (suggestions.length > 0 || showNoResults) && (
        <div
          className="border-border bg-card animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 absolute z-50 mt-2 w-full overflow-hidden rounded-xl border shadow-lg duration-200"
          role="listbox"
        >
          {showNoResults ? (
            <div className="animate-in fade-in-0 zoom-in-95 flex flex-col items-center gap-2 px-4 py-8 text-center duration-200">
              <PackageSearchIcon className="text-muted-foreground/50 size-8" />
              <p className="text-foreground text-sm font-medium">No matches for &ldquo;{trimmedQuery}&rdquo;</p>
              <p className="text-muted-foreground text-xs">Try a shorter or more general term.</p>
            </div>
          ) : (
            <>
              {suggestions.map((suggestion, index) => {
                const outOfStock = suggestion.stockStatus === 'out-of-stock'

                return (
                  <Link
                    className={cn(
                      'animate-in fade-in-0 slide-in-from-top-1 relative flex items-center gap-3 px-4 py-2.5 transition-colors',
                      index === activeIndex ? 'bg-muted' : 'hover:bg-muted',
                    )}
                    href={`/products/${suggestion.slug}`}
                    id={`search-suggestion-${index}`}
                    key={suggestion.id}
                    onClick={() => setIsOpen(false)}
                    onMouseEnter={() => setActiveIndex(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    style={{ animationDelay: `${Math.min(index, 6) * 30}ms`, animationFillMode: 'backwards' }}
                  >
                    <span
                      className={cn(
                        'bg-primary absolute inset-y-1 left-0 w-0.5 rounded-full transition-all duration-200',
                        index === activeIndex ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0',
                      )}
                    />
                    <div className="bg-muted relative size-10 shrink-0 overflow-hidden rounded-md">
                      {suggestion.imageUrl && (
                        <Image
                          alt={suggestion.title}
                          className="object-contain"
                          fill
                          sizes="40px"
                          src={suggestion.imageUrl}
                        />
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        <HighlightedText query={trimmedQuery} text={suggestion.title} />
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        {suggestion.categoryTitle && <span>{suggestion.categoryTitle}</span>}
                        {outOfStock && (
                          <>
                            {suggestion.categoryTitle && <span aria-hidden="true">·</span>}
                            <span className="text-destructive">Out of stock</span>
                          </>
                        )}
                      </span>
                    </span>
                    {typeof suggestion.priceInINR === 'number' && (
                      <Price
                        amount={suggestion.priceInINR}
                        className="text-muted-foreground shrink-0 text-sm"
                        currencyCode="INR"
                      />
                    )}
                  </Link>
                )
              })}

              {totalDocs > suggestions.length && (
                <button
                  className="group border-border text-primary hover:bg-muted animate-in fade-in-0 flex w-full items-center justify-center gap-1.5 border-t px-4 py-3 text-sm font-medium transition-colors duration-200"
                  onClick={() => goToShop(query)}
                  type="button"
                >
                  View all {totalDocs} results for &ldquo;{trimmedQuery}&rdquo;
                  <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
