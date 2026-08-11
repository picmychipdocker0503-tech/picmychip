'use client'

import { ArrowRight } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/components/pmc-ui/lib/cn'
import { Button } from '@/components/pmc-ui/primitives/Button'
import { Input } from '@/components/pmc-ui/primitives/Input'

export interface FooterColumn {
  title: string
  links: { label: string; href: string }[]
}

export interface FooterProps {
  columns: FooterColumn[]
  logo?: React.ReactNode
  newsletterHeading?: string
  newsletterCopy?: string
  onSubscribe?: (email: string) => void
  paymentBadges?: React.ReactNode
  copyrightName?: string
  className?: string
}

export function Footer({
  columns,
  logo,
  newsletterHeading = 'Get sourcing updates',
  newsletterCopy = 'New parts, price drops, and datasheet alerts — straight to your inbox.',
  onSubscribe,
  paymentBadges,
  copyrightName = 'Picmychip',
  className,
}: FooterProps) {
  const [email, setEmail] = React.useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubscribe?.(email)
    setEmail('')
  }

  return (
    <footer className={cn('border-t border-pmc-slate-200 bg-white', className)}>
      <div className="mx-auto max-w-[86rem] px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 border-b border-pmc-slate-100 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-pmc-ink-900">{newsletterHeading}</h2>
            <p className="mt-1 max-w-md text-sm text-pmc-ink-500">{newsletterCopy}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
            <Input
              type="email"
              required
              aria-label="Email address"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" rightIcon={<ArrowRight className="size-4" />}>
              Subscribe
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-8 py-10 sm:grid-cols-3 lg:grid-cols-5">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-pmc-ink-400">{column.title}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-pmc-ink-600 hover:text-pmc-blue-700">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-pmc-slate-100 pt-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-pmc-ink-500">
            {logo}
            <span>
              © {new Date().getFullYear()} {copyrightName}. All rights reserved.
            </span>
          </div>
          {paymentBadges}
        </div>
      </div>
    </footer>
  )
}
