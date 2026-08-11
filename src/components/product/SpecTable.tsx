import type { Product } from '@/payload-types'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getGeneralComparisonRows, getSpecRows } from '@/components/product/specTableRows'

type Props = {
  product: Product
}

export const SpecTable: React.FC<Props> = ({ product }) => {
  const rows = [...getGeneralComparisonRows(product), ...getSpecRows(product)]

  if (!rows.length) return null

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="specs">
        <AccordionTrigger className="text-2xl font-semibold tracking-tight hover:no-underline">
          Specifications
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-muted-foreground w-1/3 font-medium">{row.label}</TableCell>
                  <TableCell>{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
