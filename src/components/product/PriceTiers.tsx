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

  const sorted = [...tiers].sort((a, b) => (a.minQuantity ?? 0) - (b.minQuantity ?? 0))

  // Mirrors resolveTieredUnitPrice's rules exactly, so this table never shows
  // a price a customer wouldn't actually be charged: a non-last tier with no
  // maxQuantity is bounded by the next tier's minQuantity, but the highest
  // tier needs an explicit maxQuantity to price anything at all — left
  // blank, it's inactive and simply isn't shown (quantities that high fall
  // back to the flat base price, same as anything below the first tier).
  const rows: { key: string; label: string; priceInINR: number | null | undefined }[] = []

  sorted.forEach((tier, index) => {
    const next = sorted[index + 1]
    const isLast = !next
    const max = tier.maxQuantity ?? next?.minQuantity

    if (isLast && !tier.maxQuantity) return

    rows.push({
      key: tier.id ?? String(tier.minQuantity),
      label: max ? `${tier.minQuantity} - ${max}` : `${tier.minQuantity}+`,
      priceInINR: tier.priceInINR,
    })
  })

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
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-primary font-semibold">
                {typeof row.priceInINR === 'number' && <Price amount={row.priceInINR} as="span" />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
