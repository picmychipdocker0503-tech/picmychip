'use client'

import type { TrustBadgesStripBlock as TrustBadgesStripBlockProps } from '@/payload-types'

import { SHIP_TO_COUNTRY } from '@/lib/shipToCountries'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { HeadsetIcon, LockIcon, RotateCcwIcon, ShieldCheckIcon, Sparkles, TruckIcon } from 'lucide-react'
import React from 'react'

const ICON_MAP = {
  shipping: TruckIcon,
  support: HeadsetIcon,
  secure: LockIcon,
  returns: RotateCcwIcon,
  verified: ShieldCheckIcon,
} as const

const DEFAULT_BADGES: { icon: keyof typeof ICON_MAP; label: string; description: string }[] = [
  {
    icon: 'shipping',
    label: 'Same-Day Dispatch',
    description: 'In-stock orders ship the same day, straight from verified inventory.',
  },
  {
    icon: 'verified',
    label: '100% Spec-Verified Parts',
    description: 'Every listing is checked against its datasheet before it goes live.',
  },
  {
    icon: 'secure',
    label: 'Encrypted Checkout',
    description: 'Cards, UPI, and net banking — all processed securely via PayU.',
  },
  {
    icon: 'returns',
    label: '7-Day Easy Returns',
    description: 'Wrong part or DOA? Start a return right from your order history.',
  },
  {
    icon: 'support',
    label: 'Hardware Support',
    description: 'Real electrical engineers on chat and email — not a script.',
  },
]

export const TrustBadgesStripBlock: React.FC<
  TrustBadgesStripBlockProps & {
    id?: string | number
  }
> = ({ badges }) => {
  const { currency } = useCurrency()
  const resolved = badges && badges.length > 0 ? badges : DEFAULT_BADGES
  const country = SHIP_TO_COUNTRY[currency?.code ?? '']?.country

  return (
    <section className="container my-12">
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-8 sm:p-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 mb-3">
              <Sparkles className="size-3.5" />
              THE PICMYCHIP STANDARD
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Why {country ? `makers in ${country.toUpperCase()}` : 'engineers & makers'} trust us with their re-orders.
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Zero counterfeit tolerance, guaranteed pinout accuracy, and same-day handling.
          </p>
        </div>

        <ul className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {resolved.map((badge, index) => {
            const Icon = ICON_MAP[badge.icon as keyof typeof ICON_MAP] ?? ShieldCheckIcon

            return (
              <li
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-background/80 hover:border-primary/50 hover:bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                key={index}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                    <Icon className="size-4.5" />
                  </div>
                </div>

                <div>
                  <div className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {badge.label}
                  </div>
                  {badge.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {badge.description}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
