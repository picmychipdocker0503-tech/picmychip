'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/components/pmc-ui/lib/cn'

export interface MegaMenuLink {
  label: string
  href: string
  description?: string
}

export interface MegaMenuColumn {
  heading?: string
  links: MegaMenuLink[]
}

export interface MegaMenuPromo {
  title: string
  description?: string
  href: string
  imageUrl?: string
}

export interface MegaMenuProps {
  open: boolean
  columns: MegaMenuColumn[]
  promo?: MegaMenuPromo
  className?: string
  id?: string
}

export function MegaMenu({ open, columns, promo, className, id }: MegaMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={cn(
            'absolute left-0 top-full z-40 mt-2 w-[min(64rem,90vw)] rounded-lg border border-pmc-slate-200 bg-white p-6 shadow-pmc-lg',
            className,
          )}
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
            <div className="grid grid-cols-1 gap-6 sm:col-span-3 sm:grid-cols-3">
              {columns.map((column, index) => (
                <div key={column.heading ?? index}>
                  {column.heading && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-pmc-ink-400">
                      {column.heading}
                    </p>
                  )}
                  <ul className="flex flex-col gap-2.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="block text-sm text-pmc-ink-700 hover:text-pmc-blue-700"
                        >
                          {link.label}
                          {link.description && (
                            <span className="block text-xs text-pmc-ink-400">{link.description}</span>
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {promo && (
              <a
                href={promo.href}
                className="group relative flex flex-col justify-end overflow-hidden rounded-lg bg-pmc-blue-900 p-4 text-white"
              >
                {promo.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={promo.imageUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-40 transition-opacity group-hover:opacity-55"
                  />
                )}
                <div className="relative">
                  <p className="text-sm font-semibold">{promo.title}</p>
                  {promo.description && <p className="mt-1 text-xs text-white/80">{promo.description}</p>}
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium">
                    Shop now <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </a>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
