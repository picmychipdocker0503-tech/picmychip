import React from 'react'
import {
  CheckCircle2,
  Cpu,
  FileCode,
  Layers,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'

export type BentoCard = {
  id?: string | null
  title: string
  description: string
  badge?: string | null
  size?: 'small' | 'medium' | 'large' | null
  cardType?: 'default' | 'specs' | 'code' | 'highlight' | 'media' | null
  specRows?: Array<{ id?: string | null; label: string; value: string }> | null
  codeSnippet?: string | null
  codeLanguage?: string | null
  media?: string | MediaType | null
  enableLink?: boolean | null
  link?: any
}

export type FeatureBentoBlockProps = {
  id?: string | number
  eyebrow?: string | null
  heading: string
  description?: string | null
  cards?: BentoCard[] | null
}

const DEFAULT_CARDS: BentoCard[] = [
  {
    title: 'Spec-Verified Datasheets',
    description: 'Pinouts, electrical ratings, and thermal parameters directly verified against original manufacturer specs.',
    badge: '100% Guaranteed',
    size: 'medium',
    cardType: 'specs',
    specRows: [
      { label: 'Operating Voltage', value: '3.3V – 5.0V DC' },
      { label: 'Tolerance Rating', value: '±1% High Precision' },
      { label: 'Package / Footprint', value: '0805 SMD / Reel' },
      { label: 'ESD Protection', value: 'IEC 61000-4-2 Level 4' },
    ],
  },
  {
    title: 'Microsecond Parametric Search',
    description: 'Filter instantly by footprint, tolerance, dielectric, and voltage without digging through 80-page PDFs.',
    badge: 'Fast Query',
    size: 'small',
    cardType: 'default',
  },
  {
    title: 'Maker & Dev-Kit Integration',
    description: 'Plug-and-play code snippets, Arduino/ESP-IDF libraries, and pinout definitions ready to flash.',
    badge: 'Code Ready',
    size: 'small',
    cardType: 'code',
    codeLanguage: 'sensor_init.cpp',
    codeSnippet: `// Picmychip Precision ADC Setup
#include <pmc_sensor.h>
PMCDevice sensor(0x48);
void setup() {
  sensor.begin(SAMPLE_RATE_860SPS);
  sensor.setGain(PGA_6_144V);
}`,
  },
  {
    title: 'Direct-From-Reel Authenticity',
    description: 'Never risk counterfeit passives or relabeled ICs. Sourced exclusively through certified semiconductor supply chains.',
    badge: 'Anti-Counterfeit',
    size: 'medium',
    cardType: 'highlight',
  },
]

export const FeatureBentoBlock: React.FC<FeatureBentoBlockProps> = ({
  eyebrow,
  heading,
  description,
  cards,
}) => {
  const resolvedCards = cards && cards.length > 0 ? cards : DEFAULT_CARDS

  return (
    <section className="container my-20">
      <div className="mx-auto max-w-3xl text-center mb-14">
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 mb-4 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="size-3.5" />
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {heading}
        </h2>
        {description && (
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resolvedCards.map((card, index) => {
          const isMedium = card.size === 'medium'
          const isLarge = card.size === 'large'
          const colSpanClass = isLarge
            ? 'md:col-span-3'
            : isMedium
              ? 'md:col-span-2'
              : 'md:col-span-1'

          const isHighlight = card.cardType === 'highlight'

          return (
            <div
              key={card.id || index}
              className={`${colSpanClass} group relative flex flex-col justify-between overflow-hidden rounded-3xl border ${
                isHighlight
                  ? 'border-primary/40 bg-gradient-to-br from-primary/15 via-card to-primary/5 shadow-lg shadow-primary/5'
                  : 'border-border/80 bg-card hover:border-primary/40 shadow-sm hover:shadow-md'
              } p-7 transition-all duration-300`}
            >
              {/* Subtle background glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />

              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  {card.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border">
                      {card.badge}
                    </span>
                  ) : (
                    <span className="size-2" />
                  )}
                  {card.cardType === 'specs' && <Layers className="size-4 text-primary" />}
                  {card.cardType === 'code' && <Terminal className="size-4 text-primary" />}
                  {card.cardType === 'highlight' && <Zap className="size-4 text-primary" />}
                  {card.cardType === 'default' && <Cpu className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                </div>

                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Interactive Visual Payload by cardType */}
              {card.cardType === 'specs' && card.specRows && card.specRows.length > 0 && (
                <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border/60">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {card.specRows.map((spec, sIdx) => (
                      <div key={spec.id || sIdx} className="flex flex-col">
                        <span className="text-muted-foreground font-medium">{spec.label}</span>
                        <span className="font-semibold text-foreground mt-0.5">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {card.cardType === 'code' && card.codeSnippet && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-inner">
                  <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-1.5 bg-neutral-900/80 text-[11px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="size-3 text-primary" />
                      {card.codeLanguage || 'code.cpp'}
                    </span>
                    <span className="flex gap-1">
                      <span className="size-2 rounded-full bg-neutral-700" />
                      <span className="size-2 rounded-full bg-neutral-700" />
                    </span>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                    <code>{card.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {card.cardType === 'highlight' && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                  <div className="rounded-xl bg-primary p-2 text-primary-foreground shrink-0 shadow-sm">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-foreground">Traceable Batch Certifications</div>
                    <div className="text-muted-foreground mt-0.5">Lot numbers & factory sealed packaging on all reels</div>
                  </div>
                </div>
              )}

              {card.media && typeof card.media === 'object' && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
                  <Media
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    resource={card.media}
                  />
                </div>
              )}

              {card.enableLink && card.link && (
                <div className="mt-6 pt-2">
                  <CMSLink {...card.link} appearance="link" className="text-sm font-semibold text-primary hover:underline" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
