'use client'

import type { Product, Variant } from '@/payload-types'

import { Price } from '@/components/Price'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bulkPricingSettingsFromFlags, getItemPriceTiers } from '@/lib/priceTiers'
import { useFeatureFlags } from '@/lib/useFeatureFlags'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { BadgePercent, PackageIcon } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type Props = {
  product: Product
}

/**
 * DigiKey-style price-break table: one row per break quantity with its unit
 * price and the extended price for buying exactly that many. Tiers come from
 * getItemPriceTiers — the same resolver the server charges from — so this
 * never shows a price a customer wouldn't actually pay.
 */
export const PriceTiers: React.FC<Props> = ({ product }) => {
  const flags = useFeatureFlags()
  const { currency } = useCurrency()
  const searchParams = useSearchParams()

  // Tiers are INR-only — any other currency is flat-priced (see AddToCart.tsx).
  if (currency.code !== 'INR') return null

  let variant: Variant | undefined
  if (product.enableVariants) {
    const variantId = searchParams.get('variant')
    variant = product.variants?.docs?.find(
      (doc): doc is Variant => typeof doc === 'object' && String(doc.id) === variantId,
    )
    // No variant chosen yet — nothing meaningful to price.
    if (!variant) return null
  }

  const tiers = getItemPriceTiers(product, variant, bulkPricingSettingsFromFlags(flags))
  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity)

  // Mirrors resolveTieredUnitPrice: an admin-entered top tier with no
  // maxQuantity is inactive (it prices nothing), so it isn't shown.
  const rows = sorted.filter((tier, index) => index < sorted.length - 1 || tier.maxQuantity != null)

  if (!rows.length) return null

  const standardPack = product.standardPackQuantity ?? undefined
  const hasStandardPackRow = rows.some((row) => row.minQuantity === standardPack)

  return (
    <div className="border-border bg-card rounded-3xl border p-6 sm:p-8">
      <h2 className="mb-1 flex items-center gap-3">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
          <BadgePercent className="size-4.5" />
        </span>
        <span className="text-xl font-semibold tracking-tight sm:text-2xl">Bulk Pricing</span>
      </h2>
      <p className="text-muted-foreground mb-4 text-xs">All prices are in INR, excluding GST</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead className="text-right">Ext Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.minQuantity}>
              <TableCell className="font-medium">
                <span className="flex items-center gap-1.5">
                  {row.minQuantity === standardPack && (
                    <PackageIcon aria-label="Manufacturer standard package" className="size-4" />
                  )}
                  {row.minQuantity.toLocaleString('en-IN')}
                </span>
              </TableCell>
              <TableCell>
                <Price amount={row.priceInINR} as="span" />
              </TableCell>
              <TableCell className="text-right font-semibold">
                <Price amount={row.priceInINR * row.minQuantity} as="span" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasStandardPackRow && (
        <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs font-medium">
          <PackageIcon className="size-4" /> Manufacturer&apos;s Standard Package
        </p>
      )}
    </div>
  )
}
