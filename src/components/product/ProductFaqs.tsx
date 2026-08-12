import type { Product } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { generateProductFaqs } from '@/lib/generateProductFaqs'
import { buildFaqPageJsonLd } from '@/utilities/jsonLd'
import { MessageCircleQuestionIcon } from 'lucide-react'

type Props = {
  product: Product
}

/**
 * Auto-generated per-product Q&A — content is synthesized from real product
 * fields (stock, price, brand, specs, ...) rather than hand-written, so it
 * scales across the catalog. The FAQPage JSON-LD is the actual SEO/AEO
 * payload (search + answer-engine crawlers read the structured data; the
 * accordion below is the human-facing rendering of the same content).
 */
export const ProductFaqs: React.FC<Props> = ({ product }) => {
  const faqs = generateProductFaqs(product)

  if (faqs.length === 0) return null

  return (
    <div className="border-border bg-card rounded-3xl border p-6 sm:p-8">
      <JsonLd data={buildFaqPageJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer })))} />

      <h2 className="mb-2 flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
          <MessageCircleQuestionIcon className="size-4.5" />
        </span>
        <span className="text-xl font-semibold tracking-tight sm:text-2xl">Frequently Asked Questions</span>
      </h2>

      <Accordion type="single" collapsible>
        {faqs.map((faq, index) => (
          <AccordionItem className="border-none" key={faq.question} value={`faq-${index}`}>
            <AccordionTrigger className="group hover:bg-primary/5 -mx-3 rounded-2xl px-3 py-4 text-left text-base font-semibold hover:no-underline">
              <span className="flex items-center gap-3.5">
                <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{faq.question}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 pl-11 pr-4 text-sm leading-relaxed sm:text-base">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
