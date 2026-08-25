'use client'

import Link from 'next/link'
import { BookOpenIcon, CreditCardIcon, PackageSearchIcon, RotateCcwIcon, SearchIcon, TruckIcon } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { getGuideIllustration } from '@/components/illustrations/guides'

export type HelpLink = {
  title: string
  description: string
  href: string
  // Guides collection `slug` — resolved to a full-color cover illustration
  // via getGuideIllustration, same string-key pattern as HelpSectionIcon
  // (icon components can't cross the Server -> Client Component boundary).
  illustration?: string
}

export type HelpSectionIcon = 'orders' | 'shipping' | 'returns' | 'payments' | 'guides'

export type HelpSection = {
  title: string
  icon: HelpSectionIcon
  links: HelpLink[]
}

// Icon components can't be passed as props from a Server Component (page.tsx)
// to this Client Component — React can only serialize plain data across that
// boundary, not function/component references. Sections carry a string key
// instead, resolved to a real icon only here, client-side.
const ICON_MAP: Record<HelpSectionIcon, React.ComponentType<{ className?: string }>> = {
  orders: PackageSearchIcon,
  shipping: TruckIcon,
  returns: RotateCcwIcon,
  payments: CreditCardIcon,
  guides: BookOpenIcon,
}

type Props = {
  quickLinks: HelpLink[]
  sections: HelpSection[]
}

function matches(query: string, link: HelpLink) {
  const haystack = `${link.title} ${link.description}`.toLowerCase()
  return haystack.includes(query)
}

export function HelpCenterClient({ quickLinks, sections }: Props) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()

  const filteredSections = useMemo(() => {
    if (!normalized) return sections

    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => matches(normalized, link)),
      }))
      .filter((section) => section.links.length > 0)
  }, [normalized, sections])

  const filteredQuickLinks = useMemo(() => {
    if (!normalized) return quickLinks
    return quickLinks.filter((link) => matches(normalized, link))
  }, [normalized, quickLinks])

  const hasResults = filteredQuickLinks.length > 0 || filteredSections.length > 0

  return (
    <div className="container flex flex-col gap-12 py-12 sm:py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Help Center</h1>
        <p className="text-muted-foreground max-w-xl text-balance">
          Answers on orders, sourcing, shipping, returns, and your account — or search below for
          something specific.
        </p>

        <div className="relative w-full max-w-lg">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
          <input
            aria-label="Search the Help Center"
            className="border-border bg-card focus-visible:ring-ring w-full rounded-full border py-3 pr-4 pl-11 text-sm outline-none focus-visible:ring-2"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for help — orders, returns, shipping..."
            type="search"
            value={query}
          />
        </div>
      </div>

      {!hasResults && (
        <p className="text-muted-foreground text-center text-sm">
          No matches for &ldquo;{query}&rdquo; —{' '}
          <Link className="text-primary font-medium hover:underline" href="/contact">
            contact support
          </Link>{' '}
          instead.
        </p>
      )}

      {filteredQuickLinks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {filteredQuickLinks.map((link) => (
            <Link
              className="group border-border bg-card hover:border-primary/50 hover:bg-card flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              href={link.href}
              key={link.href}
            >
              <span className="group-hover:text-primary text-sm font-semibold transition-colors">
                {link.title}
              </span>
              <span className="text-muted-foreground text-xs">{link.description}</span>
            </Link>
          ))}
        </div>
      )}

      {filteredSections.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSections.map((section) => {
            const Icon = ICON_MAP[section.icon]
            return (
              <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6" key={section.title}>
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-4.5" />
                  </div>
                  <h2 className="font-semibold">{section.title}</h2>
                </div>

                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => {
                    const Illustration = getGuideIllustration(link.illustration)
                    return (
                      <li key={link.href}>
                        <Link className="group flex items-center gap-3" href={link.href}>
                          {Illustration && (
                            <span className="border-border relative size-12 shrink-0 overflow-hidden rounded-lg border">
                              <Illustration className="absolute inset-0 h-full w-full" />
                            </span>
                          )}
                          <span className="flex flex-col">
                            <span className="group-hover:text-primary text-sm font-medium transition-colors">
                              {link.title}
                            </span>
                            <span className="text-muted-foreground text-xs">{link.description}</span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
