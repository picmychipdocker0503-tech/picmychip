import type { Product } from '@/payload-types'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Props = {
  product: Product
}

export const PriceTiers: React.FC<Props> = ({ product }) => {
  const tiers = product.priceTiers ?? []

  if (!tiers.length) return null

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">Bulk Pricing</h2>
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
              <TableCell>{tier.minQuantity}+</TableCell>
              <TableCell>₹{tier.priceInINR?.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
