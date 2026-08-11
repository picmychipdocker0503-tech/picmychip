'use client'

import React from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Download,
  Flame,
  Layers,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

import type { Page } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { RichText } from '@/components/RichText'
import { Cable, Capacitor, Connector, Resistor, getIllustration } from '@/components/illustrations'

const TRUST_BADGES = [
  { icon: ShieldCheck, label: '100% Datasheet-Verified', highlight: 'Zero counterfeit guarantee' },
  { icon: Truck, label: 'Same-Day Dispatch', highlight: 'Orders before 3 PM' },
  { icon: Lock, label: 'Secure Checkout', highlight: 'Cards, UPI & NetBanking' },
  { icon: Zap, label: 'Instant Pinouts', highlight: 'Schematics & CAD files' },
]

const QUICK_CATEGORIES = [
  { label: 'Passives', href: '/category/resistor' },
  { label: 'Connectors', href: '/category/connectors' },
  { label: 'Capacitors', href: '/category/capacitor' },
  { label: 'ICs & Chips', href: '/category/ic' },
  { label: 'Diodes', href: '/category/diode' },
  { label: 'Drone Parts', href: '/category/drone-parts' },
]

export const IllustratedHero: React.FC<Page['hero']> = ({ links, richText, illustrationKey }) => {
  const Illustration = getIllustration(illustrationKey)

  return (
    <div className="relative overflow-hidden pt-4 pb-12 lg:pt-8 lg:pb-16">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[480px] w-full max-w-7xl -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-orange-500/10 to-transparent blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-1/3 -left-32 -z-10 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-32 -z-10 size-96 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="container">
        {/* Main Hero Card */}
        <div className="relative rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-8 sm:p-10 lg:p-14 shadow-xl shadow-primary/5 overflow-hidden">
          
          {/* Subtle Decorative Circuit Background SVGs */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <Resistor className="text-primary pointer-events-none absolute -top-6 -right-6 hidden size-28 -rotate-12 opacity-10 lg:block" />
          <Connector className="text-orange-500 pointer-events-none absolute -bottom-10 left-1/3 hidden size-28 rotate-12 opacity-10 lg:block" />
          <Capacitor className="text-primary pointer-events-none absolute top-1/2 -left-8 hidden size-24 -rotate-45 opacity-10 xl:block" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left">
              
              {/* Top Live Status Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm mb-6">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span>50,000+ Verified Components In Stock</span>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <span className="hidden sm:inline font-normal text-muted-foreground">Ready to Dispatch</span>
              </div>

              {/* Headline & Description */}
              {richText ? (
                <RichText
                  className="[&>h1]:text-3xl [&>h1]:sm:text-4xl [&>h1]:lg:text-5xl [&>h1]:font-black [&>h1]:tracking-tight [&>h1]:leading-[1.15] [&>p]:mt-4 [&>p]:text-base [&>p]:sm:text-lg [&>p]:text-muted-foreground [&>p]:leading-relaxed"
                  data={richText}
                  enableGutter={false}
                />
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                    Electronic Components, Connectors &amp; Silicon
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Resistors, capacitors, diodes, connectors, cables, ICs, and drone parts — every listing shows the specs that actually matter, so you order the right part the first time.
                  </p>
                </>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                {Array.isArray(links) && links.length > 0 ? (
                  links.map(({ link }, i) => (
                    <CMSLink
                      key={i}
                      {...link}
                      size="lg"
                      className={
                        i === 0
                          ? 'shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200'
                          : 'backdrop-blur-md bg-background/80 hover:bg-background'
                      }
                    />
                  ))
                ) : (
                  <>
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                      Shop All Components <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/guides"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-all"
                    >
                      Browse Guides
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Filter Pill Bar */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                  Popular:
                </span>
                {QUICK_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="inline-flex items-center rounded-lg border border-border/60 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column: Hardware Matrix Visualizer Glass Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              
              {/* Central Hardware Visualizer Card */}
              <div className="relative w-full max-w-md rounded-2xl border border-border/90 bg-neutral-950 p-6 text-white shadow-2xl overflow-hidden">
                
                {/* Neon Accent Glow */}
                <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/30 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-orange-500/20 blur-2xl" />

                {/* Card Header Bar */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                      <Cpu className="size-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold tracking-tight text-white flex items-center gap-1.5">
                        PMC-CORE-V2
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-400 font-sans font-semibold">
                          VERIFIED
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400">Spec-Verified Hardware</div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-800/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    In Stock
                  </span>
                </div>

                {/* Center Illustration with Aura */}
                <div className="relative my-4 flex items-center justify-center py-6">
                  <div className="absolute size-36 rounded-full bg-gradient-to-tr from-primary/20 to-orange-500/20 blur-xl" />
                  <div className="relative flex size-32 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-inner">
                    <Illustration className="text-primary size-20" />
                  </div>
                </div>

                {/* Live Spec Matrix Grid */}
                <div className="mt-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Tolerance Rating</span>
                    <span className="font-mono font-bold text-white">±0.5% Ultra-Precision</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Operating Voltage</span>
                    <span className="font-mono font-bold text-white">1.8V – 5.5V DC</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">ESD Protection</span>
                    <span className="font-mono font-bold text-emerald-400">IEC 61000-4-2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Package / Reel</span>
                    <span className="font-mono font-bold text-white">SMD 0805 / Factory Sealed</span>
                  </div>
                </div>

                {/* Card Footer Features */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    RoHS 3 Compliant
                  </span>
                  <span className="flex items-center gap-1 font-mono text-primary">
                    <Download className="size-3.5" />
                    Datasheet PDF
                  </span>
                </div>
              </div>

              {/* Floating Mini Glass Badges */}
              <div className="hidden sm:flex absolute -bottom-5 -left-4 items-center gap-2 rounded-xl border border-border/80 bg-card/90 backdrop-blur-lg px-3.5 py-2 shadow-lg text-xs font-semibold text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Anti-Counterfeit Inspected</span>
              </div>

              <div className="hidden sm:flex absolute -top-3 -right-3 items-center gap-2 rounded-xl border border-border/80 bg-card/90 backdrop-blur-lg px-3.5 py-2 shadow-lg text-xs font-semibold text-foreground">
                <Flame className="size-4 text-orange-500" />
                <span>Same-Day Dispatch</span>
              </div>
            </div>

          </div>

          {/* Bottom Trust Indicators Bar */}
          <div className="mt-12 pt-8 border-t border-border/60 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label, highlight }) => (
              <div key={label} className="flex items-center gap-3 p-2 rounded-xl">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Icon className="size-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-foreground leading-snug">{label}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{highlight}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
