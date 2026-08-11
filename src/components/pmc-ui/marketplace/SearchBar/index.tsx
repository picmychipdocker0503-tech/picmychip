'use client'

import * as React from 'react'
import { Search } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface SearchSuggestion {
  id: string
  label: string
  description?: string
  href: string
  imageUrl?: string
}

export interface SearchBarProps {
  placeholder?: string
  suggestions?: SearchSuggestion[]
  loading?: boolean
  onQueryChange?: (query: string) => void
  onSubmit?: (query: string) => void
  className?: string
}

export function SearchBar({
  placeholder = 'Search by part number, keyword, or category…',
  suggestions = [],
  loading,
  onQueryChange,
  onSubmit,
  className,
}: SearchBarProps) {
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    setActiveIndex(-1)
    setOpen(value.length > 0)
    onQueryChange?.(value)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setOpen(false)
    onSubmit?.(query)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const listboxId = React.useId()

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form role="search" onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-pmc-ink-400" aria-hidden="true" />
          <input
            type="search"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            placeholder={placeholder}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setOpen(query.length > 0)}
            onKeyDown={handleKeyDown}
            className="h-11 w-full rounded-md border border-pmc-slate-300 bg-white pl-9 pr-4 text-sm text-pmc-ink-900 placeholder:text-pmc-ink-400 focus-visible:border-pmc-blue-600 focus-visible:outline-none focus-visible:shadow-pmc-focus"
          />
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-pmc-slate-200 bg-white shadow-pmc-lg"
        >
          {loading && <li className="px-4 py-3 text-sm text-pmc-ink-400">Searching…</li>}
          {!loading &&
            suggestions.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === activeIndex}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-pmc-blue-50',
                    index === activeIndex && 'bg-pmc-blue-50',
                  )}
                >
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="size-8 shrink-0 rounded object-contain" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-pmc-ink-800">{item.label}</span>
                    {item.description && (
                      <span className="block truncate text-xs text-pmc-ink-400">{item.description}</span>
                    )}
                  </span>
                </a>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
