import type { CustomerInteractionBlock as CustomerInteractionBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/cn'
import {
  ArrowRight,
  ClipboardCheck,
  Headphones,
  MapPin,
  MessageSquareQuote,
  PackageSearch,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import React from 'react'

const channelIcons = {
  quote: ClipboardCheck,
  service: Wrench,
  technical: Headphones,
  tracking: PackageSearch,
}

type Channel = NonNullable<CustomerInteractionBlockProps['channels']>[number]
type Step = NonNullable<CustomerInteractionBlockProps['steps']>[number]
type Metric = NonNullable<CustomerInteractionBlockProps['metrics']>[number]

const defaultChannels: Channel[] = [
  {
    type: 'quote' as const,
    title: 'Request a Quote / BOM Upload',
    description: 'Upload your BOM spreadsheet for instant volume pricing and lead time checks.',
    responseTime: 'Within 2 hours',
  },
  {
    type: 'technical' as const,
    title: 'Hardware & Spec Guidance',
    description: 'Get engineer-level assistance on package footprints, voltage ratings, and datasheets.',
    responseTime: 'Within 4 hours',
  },
  {
    type: 'tracking' as const,
    title: 'Live Order Tracking',
    description: 'Real-time shipment telemetry, invoice downloads, and delivery updates.',
    responseTime: 'Instant lookup',
  },
  {
    type: 'service' as const,
    title: 'Custom Cables & Kitting',
    description: 'Order custom harness assemblies, pre-packaged maker lab kits, and PCB services.',
    responseTime: 'Same business day',
  },
]

const defaultSteps: Step[] = [
  {
    label: '1. Share specs or BOM',
    detail: 'Upload your component spreadsheet or enter parameters directly.',
  },
  {
    label: '2. Review spec-matched options',
    detail: 'Our engineering team matches parts with real-time stock and tiered discounts.',
  },
  {
    label: '3. Rapid dispatch',
    detail: 'Approve the quote and your components are dispatched in factory-sealed reels.',
  },
]

const defaultMetrics: Metric[] = [
  { value: '< 2h', label: 'Average Response Time' },
  { value: '50k+', label: 'Components Available' },
  { value: '99.8%', label: 'Order Accuracy' },
]

export const CustomerInteractionBlock: React.FC<
  CustomerInteractionBlockProps & {
    id?: string | number
  }
> = ({ channels, eyebrow, heading, intro, metrics, primaryLink, secondaryLink, steps }) => {
  const resolvedChannels = channels?.length ? channels : defaultChannels
  const resolvedSteps = steps?.length ? steps : defaultSteps
  const resolvedMetrics = metrics?.length ? metrics : defaultMetrics

  return (
    <section className="container my-16">
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Subtle Ambient Background Gradients */}
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-orange-500/10 blur-3xl" />

        {/* Left Side: Sourcing Channels & CTA */}
        <div className="relative z-10 p-8 sm:p-10 lg:p-12">
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20">
              <Sparkles className="size-3.5" />
              {eyebrow}
            </div>
          )}

          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
              {heading}
            </h2>
            {intro && (
              <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed">
                {intro}
              </p>
            )}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {resolvedChannels.map((channel, index) => {
              const Icon = channelIcons[channel.type ?? 'quote'] ?? ClipboardCheck

              return (
                <div
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-background/80 hover:border-primary/50 hover:bg-card p-5 transition-all duration-300 hover:shadow-md"
                  key={channel.id ?? index}
                >
                  <div>
                    <div className="mb-3.5 flex items-start justify-between gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                        <Icon className="size-5" />
                      </span>
                      {channel.responseTime && (
                        <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {channel.responseTime}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {channel.title}
                    </h3>
                    {channel.description && (
                      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                        {channel.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            {primaryLink?.label && (
              <CMSLink
                {...primaryLink}
                appearance="default"
                size="lg"
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30"
              />
            )}
            {secondaryLink?.label && (
              <CMSLink {...secondaryLink} appearance="outline" size="lg" />
            )}
          </div>
        </div>

        {/* Right Side: Interactive Workflow Desk & Telemetry */}
        <div className="relative z-10 flex flex-col justify-between border-t border-border/70 bg-muted/30 p-8 sm:p-10 lg:border-t-0 lg:border-l lg:p-12">
          <div className="rounded-2xl border border-border/80 bg-background/90 backdrop-blur-md p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  Live Sourcing Desk
                </p>
                <p className="text-muted-foreground text-xs">Real-time quote &amp; BOM processing</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            <div className="space-y-4">
              {resolvedSteps.map((step, index) => (
                <div className="flex gap-3.5" key={step.id ?? index}>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-xs font-bold font-mono transition-colors',
                        index === 0
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                          : 'border border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                    {index < resolvedSteps.length - 1 && (
                      <span className="bg-border/80 mt-2 h-full w-px" />
                    )}
                  </div>
                  <div className="pb-3">
                    <h4 className="text-xs font-bold text-foreground">{step.label}</h4>
                    {step.detail && (
                      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{step.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {resolvedMetrics.map((metric, index) => (
              <div
                className="rounded-2xl border border-border/70 bg-background/80 p-4 text-center"
                key={metric.id ?? index}
              >
                <div className="text-lg sm:text-xl font-black bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                  {metric.value}
                </div>
                <div className="text-muted-foreground mt-1 text-[11px] font-medium leading-tight">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          <div className="text-muted-foreground mt-6 flex items-center gap-2 text-xs">
            <MapPin className="size-4 text-primary shrink-0" />
            <span>Direct support for production runs, maker labs, and research facilities.</span>
          </div>
        </div>

      </div>
    </section>
  )
}
