import type { RfqBomSectionBlock as RfqBomSectionBlockProps } from '@/payload-types'

import { FileSpreadsheet, ListChecks, Sparkles, Table2, Upload } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const RfqBomSectionBlock: React.FC<
  RfqBomSectionBlockProps & { id?: string | number }
> = ({ badge, bomCard, heading, primaryLink, rfqCard, secondaryLink, subtitle }) => {
  const featureCards = [
    { icon: FileSpreadsheet, badge: bomCard?.badge, title: bomCard?.title, description: bomCard?.description },
    { icon: ListChecks, badge: rfqCard?.badge, title: rfqCard?.title, description: rfqCard?.description },
  ]

  return (
    <section className="container my-16">
      <div className="border-border/80 bg-card/60 relative overflow-hidden rounded-3xl border p-8 backdrop-blur-xl sm:p-10 lg:p-14">
        <div className="bg-primary/20 pointer-events-none absolute top-0 right-0 size-80 -translate-y-1/3 translate-x-1/4 rounded-full blur-3xl" />
        <svg
          aria-hidden="true"
          className="text-primary/10 pointer-events-none absolute -bottom-10 -left-10 size-64"
          fill="none"
          viewBox="0 0 200 200"
        >
          <path d="M10 100h50m0 0v-60m0 60v60m0-60h60m0 0v-40a10 10 0 0 1 10-10h40" stroke="currentColor" strokeWidth="2" />
          <circle cx="60" cy="40" fill="currentColor" r="4" />
          <circle cx="120" cy="60" fill="currentColor" r="4" />
          <circle cx="170" cy="50" fill="currentColor" r="4" />
        </svg>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {badge && (
            <div className="border-primary/20 bg-primary/10 text-primary mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="size-3.5" />
              {badge}
            </div>
          )}

          <h2 className="text-foreground text-3xl leading-tight font-black tracking-tight sm:text-4xl lg:text-5xl">
            {heading}
          </h2>

          {subtitle && (
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
              {subtitle}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {primaryLink?.url && primaryLink?.label && (
              <Link
                className="btn btn-primary border-0 shadow-primary/20 h-10 gap-2 rounded-md px-6 text-sm font-medium shadow-lg"
                href={primaryLink.url}
              >
                <Upload className="size-4" />
                {primaryLink.label}
              </Link>
            )}
            {secondaryLink?.url && secondaryLink?.label && (
              <Link
                className="btn btn-outline h-10 gap-2 rounded-md px-6 text-sm font-medium"
                href={secondaryLink.url}
              >
                <Table2 className="size-4" />
                {secondaryLink.label}
              </Link>
            )}
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {featureCards.map((card, index) => (
            <div
              className="group border-border/70 bg-background/80 hover:border-primary/50 hover:bg-card relative flex flex-col rounded-2xl border p-5 transition-all duration-300 hover:shadow-md"
              key={card.title ?? index}
            >
              <div className="mb-3.5 flex items-start justify-between gap-3">
                <span className="bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200">
                  <card.icon className="size-5" />
                </span>
                {card.badge && (
                  <span className="border-border bg-muted/60 text-muted-foreground rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                    {card.badge}
                  </span>
                )}
              </div>
              <h3 className="group-hover:text-primary text-sm font-bold text-foreground transition-colors">
                {card.title}
              </h3>
              {card.description && (
                <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{card.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
