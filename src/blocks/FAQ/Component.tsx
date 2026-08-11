import { HelpCircle, LifeBuoy, Sparkles } from 'lucide-react'
import React from 'react'

import { CMSLink } from '@/components/Link'
import { JsonLd } from '@/components/JsonLd'
import { RichText } from '@/components/RichText'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { FAQBlock as FAQBlockProps } from '@/payload-types'
import { buildFaqPageJsonLd } from '@/utilities/jsonLd'

export const FAQBlock: React.FC<
  FAQBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ eyebrow, heading, description, contactCard, items }) => {
  if (!items?.length) return null

  return (
    <section className="container my-20">
      <JsonLd data={buildFaqPageJsonLd(items)} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 lg:items-start">

        {/* Left Column: Heading & Support Desk */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 mb-3">
              <Sparkles className="size-3.5" />
              {eyebrow || 'FREQUENTLY ASKED QUESTIONS'}
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
              {heading || 'Frequently Asked Questions'}
            </h2>

            {description && (
              <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed">
                {description}
              </p>
            )}

            {contactCard?.enabled !== false && (
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6 sm:p-8 mt-8 shadow-sm">
                <div className="pointer-events-none absolute -right-8 -bottom-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-4">
                  <LifeBuoy className="size-6" />
                </div>

                <h3 className="text-base font-bold text-foreground">
                  {contactCard?.heading || 'Still have questions?'}
                </h3>
                
                <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm leading-relaxed">
                  {contactCard?.description || 'Our team of electrical engineers is available to help verify part pinouts and lead times.'}
                </p>

                {contactCard?.linkUrl && (
                  <div className="mt-5">
                    <CMSLink
                      appearance="default"
                      className="shadow-md shadow-primary/20"
                      label={contactCard.linkLabel || 'Contact Hardware Team'}
                      size="sm"
                      url={contactCard.linkUrl}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Accordion */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-4 sm:p-8 shadow-sm">
            <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-primary/8 blur-3xl" />

            <Accordion className="divide-border divide-y" type="single" collapsible>
              {items.map((item, index) => (
                <AccordionItem key={index} className="relative border-none py-2" value={`item-${index}`}>
                  <AccordionTrigger className="group rounded-2xl px-3 -mx-3 py-4 text-base sm:text-lg font-bold hover:no-underline hover:text-primary hover:bg-primary/5 transition-colors text-left">
                    <span className="flex items-center gap-3.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-mono font-bold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{item.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-11 pr-4 text-sm sm:text-base leading-relaxed pb-4">
                    {item.answer && <RichText data={item.answer} enableGutter={false} />}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

      </div>
    </section>
  )
}
