import type { Product } from '@/payload-types'

import { Price } from '@/components/Price'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BadgePercent } from 'lucide-react'

type Props = {
  product: Product
}

export const PriceTiers: React.FC<Props> = ({ product }) => {
  const tiers = product.priceTiers ?? []

  if (!tiers.length) return null

  return (
    <div className="border-border bg-card rounded-3xl border p-6 sm:p-8">
      <h2 className="mb-5 flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
          <BadgePercent className="size-4.5" />
        </span>
        <span className="text-xl font-semibold tracking-tight sm:text-2xl">Bulk Pricing</span>
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers.map((tier) => (
            <TableRow key={tier.id ?? tier.minQuantity}>
              <TableCell className="font-medium">{tier.minQuantity}+</TableCell>
              <TableCell className="text-primary font-semibold">
                {typeof tier.priceInINR === 'number' && <Price amount={tier.priceInINR} as="span" />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
