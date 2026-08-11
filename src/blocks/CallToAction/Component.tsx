import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'
import { RichText } from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { Chip, CircuitBoard } from '@/components/illustrations'
import { Sparkles } from 'lucide-react'

export const CallToActionBlock: React.FC<
  CTABlockProps & {
    id?: string | number
    className?: string
  }
> = ({ links, richText }) => {
  return (
    <section className="container my-20">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-neutral-950 via-card to-neutral-950 p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
        
        {/* Ambient Neon Lighting */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-80 rounded-full bg-orange-500/20 blur-3xl" />

        {/* Decorative Hardware Icons */}
        <Chip className="text-primary pointer-events-none absolute -right-8 -bottom-8 hidden size-40 opacity-15 rotate-12 lg:block" />
        <CircuitBoard className="text-orange-500 pointer-events-none absolute -left-10 -top-10 hidden size-40 opacity-10 -rotate-12 lg:block" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20">
              <Sparkles className="size-3.5" />
              BUILD WITH ZERO DELAYS
            </span>

            {richText ? (
              <RichText
                className="[&>h2]:text-2xl [&>h2]:sm:text-3xl [&>h2]:lg:text-4xl [&>h2]:font-black [&>h2]:tracking-tight [&>h2]:text-white [&>p]:mt-3 [&>p]:text-sm [&>p]:sm:text-base [&>p]:text-neutral-300 [&>p]:leading-relaxed"
                data={richText}
                enableGutter={false}
              />
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                  Ready to start your next hardware build?
                </h2>
                <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                  Explore over 50,000 spec-verified components, developer kits, and connectors with same-day dispatch.
                </p>
              </>
            )}
          </div>

          {Array.isArray(links) && links.length > 0 && (
            <div className="flex flex-wrap gap-4 shrink-0">
              {links.map(({ link }, i) => (
                <CMSLink
                  key={i}
                  {...link}
                  size="lg"
                  className={
                    i === 0
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90'
                      : 'border-neutral-700 bg-neutral-900/80 text-white hover:bg-neutral-800'
                  }
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
