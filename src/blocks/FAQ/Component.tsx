import { LifeBuoy, MessageCircleIcon, Sparkles } from 'lucide-react'
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

      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20 mb-3">
          <Sparkles className="size-3.5" />
          {eyebrow || 'FREQUENTLY ASKED QUESTIONS'}
        </span>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
          {heading || 'Frequently Asked Questions'}
        </h2>

        {description && (
          <p className="text-muted-foreground mt-3 text-sm sm:text-base leading-relaxed">{description}</p>
        )}
      </div>

      <div className="mt-10 grid items-start gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <div
            className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-sm"
            key={index}
          >
            <Accordion collapsible type="single">
              <AccordionItem className="border-none" value={`item-${index}`}>
                <AccordionTrigger className="group rounded-2xl px-5 sm:px-6 py-5 text-base font-bold hover:no-underline hover:text-primary transition-colors text-left">
                  <span className="flex items-start gap-3.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{item.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-[2.9rem] pr-5 sm:pr-6 text-sm sm:text-base leading-relaxed pb-5">
                  {item.answer && <RichText data={item.answer} enableGutter={false} />}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ))}
      </div>

      {contactCard?.enabled !== false && (
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 mt-6 flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6 text-center sm:text-left">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <LifeBuoy className="size-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">
              {contactCard?.heading || 'Still have questions?'}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {contactCard?.description ||
                'Our team of electrical engineers is available to help verify part pinouts and lead times.'}
            </p>
          </div>

          {contactCard?.linkUrl && (
            <CMSLink
              appearance="default"
              className="shrink-0 shadow-md shadow-primary/20"
              label={contactCard.linkLabel || 'Contact Hardware Team'}
              size="sm"
              url={contactCard.linkUrl}
            >
              <MessageCircleIcon className="size-4" />
            </CMSLink>
          )}
        </div>
      )}
    </section>
  )
}
