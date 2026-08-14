'use client'

import * as React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Input } from './input'

export type SearchableSelectOption = {
  value: string
  label: string
}

type Props = {
  id?: string
  className?: string
  options: SearchableSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
}

/**
 * A Select with a search box pinned above the options list — this repo has
 * no Command/Popover-based combobox component, so this wraps the existing
 * Radix-based Select (src/components/ui/select.tsx) instead of adding a new
 * dependency (cmdk). Radix's Select intercepts keystrokes for its own
 * type-ahead navigation, so the search input's keydown events are stopped
 * from bubbling to it, and focus is forced onto the input whenever the
 * dropdown opens (Radix would otherwise steal it to highlight an item).
 */
export function SearchableSelect({
  id,
  className,
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Search…',
  disabled,
}: Props) {
  const [search, setSearch] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return options
    return options.filter((option) => option.label.toLowerCase().includes(query))
  }, [options, search])

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        onValueChange(next)
        setSearch('')
      }}
      disabled={disabled}
      onOpenChange={(open) => {
        setSearch('')
        if (open) requestAnimationFrame(() => inputRef.current?.focus())
      }}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <div
          className="bg-popover sticky top-0 z-10 p-1"
          // Radix's Content otherwise intercepts arrow keys / letters for
          // its own item-navigation instead of letting the input handle them.
          onKeyDown={(e) => {
            if (e.key !== 'Escape') e.stopPropagation()
          }}
        >
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="text-muted-foreground px-2 py-4 text-center text-sm">No results.</div>
        ) : (
          filtered.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
