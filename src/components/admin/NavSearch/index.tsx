'use client'

import { SearchIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

type NavItem = {
  label: string
  href: string
  group: string
}

/**
 * Static list of every collection/global this admin surfaces in its sidebar,
 * kept in sync by hand — mirrors the `group` set on each collection/global
 * config. Deliberately separate from Payload's own nav data (which isn't
 * exposed to a `beforeNavLinks` component) rather than re-deriving it, so
 * this stays a simple, low-risk quick-jump search instead of reaching into
 * Payload internals.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Pages', href: '/admin/collections/pages', group: 'Content' },
  { label: 'Media', href: '/admin/collections/media', group: 'Content' },
  { label: 'Datasheets', href: '/admin/collections/datasheets', group: 'Content' },
  { label: 'Guides', href: '/admin/collections/guides', group: 'Content' },
  { label: 'Jobs', href: '/admin/collections/jobs', group: 'Content' },
  { label: 'Services', href: '/admin/collections/services', group: 'Content' },
  { label: 'Community Feedback', href: '/admin/collections/community-feedback', group: 'Content' },
  { label: 'Team Testimonials', href: '/admin/collections/team-testimonials', group: 'Content' },

  { label: 'Products', href: '/admin/collections/products', group: 'Catalog' },
  { label: 'Categories', href: '/admin/collections/categories', group: 'Catalog' },
  { label: 'Brands', href: '/admin/collections/brands', group: 'Catalog' },
  { label: 'Reviews', href: '/admin/collections/reviews', group: 'Catalog' },

  { label: 'Orders', href: '/admin/collections/orders', group: 'Sales' },
  { label: 'Carts', href: '/admin/collections/carts', group: 'Sales' },
  { label: 'Transactions', href: '/admin/collections/transactions', group: 'Sales' },
  { label: 'Coupons', href: '/admin/collections/coupons', group: 'Sales' },
  { label: 'Gift Cards', href: '/admin/collections/gift-cards', group: 'Sales' },
  { label: 'Stock Alerts', href: '/admin/collections/stock-alerts', group: 'Sales' },
  { label: 'Wishlists', href: '/admin/collections/wishlists', group: 'Sales' },
  { label: 'Return Requests', href: '/admin/collections/return-requests', group: 'Sales' },
  { label: 'RFQ Submissions', href: '/admin/collections/rfq-submissions', group: 'Sales' },
  { label: 'Email Events', href: '/admin/collections/email-events', group: 'Sales' },

  { label: 'Forms', href: '/admin/collections/forms', group: 'Marketing' },
  { label: 'Form Submissions', href: '/admin/collections/form-submissions', group: 'Marketing' },
  { label: 'Newsletter Subscribers', href: '/admin/collections/newsletter-subscribers', group: 'Marketing' },

  { label: 'Users', href: '/admin/collections/users', group: 'Users' },

  { label: 'Header', href: '/admin/globals/header', group: 'Site' },
  { label: 'Footer', href: '/admin/globals/footer', group: 'Site' },
  { label: 'Site Settings', href: '/admin/globals/site-settings', group: 'Settings' },
  { label: 'Feature Flags', href: '/admin/globals/feature-flags', group: 'Settings' },

  { label: 'Reports', href: '/admin/reports', group: 'Tools' },
  { label: 'Bulk Stock Update', href: '/admin/bulk-stock', group: 'Tools' },
  { label: 'Bulk Product Import', href: '/admin/bulk-products', group: 'Tools' },
  { label: 'Abandoned Checkouts', href: '/admin/abandoned-checkouts', group: 'Tools' },
  { label: 'Review Requests', href: '/admin/review-requests', group: 'Tools' },
]

export const NavSearch: React.FC = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(normalized)).slice(0, 8)
  }, [query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const navigateTo = (href: string) => {
    setQuery('')
    setIsOpen(false)
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      navigateTo(results[activeIndex].href)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="nav__search-wrap relative mb-2 px-1" ref={containerRef}>
      <div className="relative">
        <SearchIcon className="text-base-content/35 pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
        <input
          className="pmc-input pmc-input-sm bg-base-content/4 focus:bg-base-100 w-full rounded-full border-transparent pl-8 text-sm"
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Jump to…"
          type="text"
          value={query}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="border-base-content/10 bg-base-100 pmc-rounded-box absolute inset-x-1 top-full z-50 mt-1.5 overflow-hidden border py-1 shadow-lg">
          {results.map((item, index) => (
            <button
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                index === activeIndex ? 'bg-primary/8 text-primary' : 'text-base-content/80 hover:bg-base-content/5'
              }`}
              key={item.href}
              onClick={() => navigateTo(item.href)}
              onMouseEnter={() => setActiveIndex(index)}
              type="button"
            >
              <span>{item.label}</span>
              <span className="text-base-content/35 text-xs">{item.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
