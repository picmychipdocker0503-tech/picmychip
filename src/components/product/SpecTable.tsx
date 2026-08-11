import type { Product } from '@/payload-types'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { getGeneralComparisonRows, getSpecRows } from '@/components/product/specTableRows'
import { ListChecks } from 'lucide-react'

type Props = {
  product: Product
}

export const SpecTable: React.FC<Props> = ({ product }) => {
  const rows = [...getGeneralComparisonRows(product), ...getSpecRows(product)]

  if (!rows.length) return null

  return (
    <div className="border-border bg-card rounded-3xl border p-6 sm:p-8">
      <Accordion type="single" collapsible defaultValue="specs">
        <AccordionItem className="border-none" value="specs">
          <AccordionTrigger className="py-0 hover:no-underline [&>svg]:size-5">
            <span className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <ListChecks className="size-4.5" />
              </span>
              <span className="text-xl font-semibold tracking-tight sm:text-2xl">Specifications</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            <dl className="divide-border mt-4 divide-y">
              {rows.map((row) => (
                <div className="grid grid-cols-2 gap-4 py-3" key={row.label}>
                  <dt className="text-muted-foreground text-sm">{row.label}</dt>
                  <dd className="text-foreground font-mono text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
