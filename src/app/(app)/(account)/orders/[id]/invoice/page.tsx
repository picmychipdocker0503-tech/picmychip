import type { Product, Variant } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { getAccessibleOrder } from '@/lib/getAccessibleOrder'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function InvoicePage({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  const order = await getAccessibleOrder({ payload, id, user, email, accessToken })

  if (!order) notFound()

  const downloadQuery = new URLSearchParams({
    ...(email ? { email } : {}),
    ...(accessToken ? { accessToken } : {}),
  }).toString()

  const siteSettings = await getCachedGlobal('site-settings', 0)()
  const tax = siteSettings?.taxSettings

  const amount = order.amount ?? 0

  // Prefer the snapshot taken at order-creation time (computeGstTaxBreakdown
  // hook) so past invoices stay stable even if the admin later changes the
  // GST rate or business state. Falls back to a live estimate for orders
  // placed before that snapshot existed.
  const snapshot = order.taxBreakdown
  const gstRate = snapshot?.gstRatePercent ?? tax?.gstRatePercent ?? 18
  const taxableValue = snapshot?.taxableValue ?? amount / (1 + gstRate / 100)
  const totalTax = snapshot?.totalTax ?? amount - taxableValue
  const businessState = tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka'
  const isIntraState = snapshot?.taxType
    ? snapshot.taxType === 'intra-state'
    : businessState.trim().toLowerCase() === order.shippingAddress?.state?.trim().toLowerCase()

  return (
    <div className="container flex flex-col gap-6 py-16 print:py-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Tax Invoice</h1>
        <div className="flex items-center gap-3">
          {order.zohoInvoiceId ? (
            <a
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
              href={`/api/orders/${order.id}/invoice-pdf${downloadQuery ? `?${downloadQuery}` : ''}`}
            >
              Download Invoice (PDF)
            </a>
          ) : (
            order.invoiceSyncStatus !== 'failed' && (
              <p className="text-muted-foreground text-sm">
                Your official tax invoice is being generated — check back shortly.
              </p>
            )
          )}
        </div>
      </div>

      <div className="bg-card border-border rounded-2xl p-2 shadow-sm print:border-none print:p-0 print:shadow-none">
        <div className="mb-8 flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-lg font-bold">{tax?.businessName || 'Picmychip'}</p>
            {tax?.businessAddress && (
              <p className="text-muted-foreground whitespace-pre-line text-sm">{tax.businessAddress}</p>
            )}
            {tax?.gstin && <p className="text-muted-foreground text-sm">GSTIN: {tax.gstin}</p>}
          </div>

          <div className="text-right">
            <p className="text-sm">
              <span className="text-muted-foreground">Invoice #</span> INV-{order.id}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Order date:</span>{' '}
              {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Payment:</span>{' '}
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
            </p>
          </div>
        </div>

        {order.shippingAddress && (
          <div className="mb-8">
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">Billed to</p>
            <p className="text-sm">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="text-muted-foreground text-sm">
              {[
                order.shippingAddress.addressLine1,
                order.shippingAddress.addressLine2,
                order.shippingAddress.city,
                order.shippingAddress.state,
                order.shippingAddress.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            <p className="text-muted-foreground text-sm">{order.customerEmail}</p>
          </div>
        )}

        <table className="mb-8 w-full text-left text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => {
              const product = typeof item.product === 'object' ? (item.product as Product) : undefined
              const variant = typeof item.variant === 'object' ? (item.variant as Variant) : undefined
              const unitPrice = variant?.priceInINR ?? product?.priceInINR ?? 0

              return (
                <tr className="border-border border-b" key={item.id ?? index}>
                  <td className="py-2">{product?.title || 'Product'}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">
                    <Price amount={unitPrice * (item.quantity ?? 0)} as="span" />
                  </td>
                </tr>
              )
            })}
            {Boolean(order.shippingAmount) && (
              <tr className="border-border border-b">
                <td className="py-2">
                  {order.shippingMethod === 'express' ? 'Express Shipping' : 'Standard Shipping'}
                  <span className="text-muted-foreground"> (SAC 9968)</span>
                </td>
                <td className="py-2 text-right">1</td>
                <td className="py-2 text-right">
                  <Price amount={order.shippingAmount ?? 0} as="span" />
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="ml-auto flex max-w-xs flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable value</span>
            <Price amount={taxableValue} as="span" />
          </div>
          {isIntraState ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST ({(gstRate / 2).toFixed(1)}%)</span>
                <Price amount={totalTax / 2} as="span" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST ({(gstRate / 2).toFixed(1)}%)</span>
                <Price amount={totalTax / 2} as="span" />
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGST ({gstRate}%)</span>
              <Price amount={totalTax} as="span" />
            </div>
          )}
          <div className="border-border mt-1 flex justify-between border-t pt-1 text-base font-bold">
            <span>Total</span>
            <Price amount={amount} as="span" />
          </div>
        </div>

        <p className="text-muted-foreground mt-8 text-xs">
          Tax computed at a flat {gstRate}% assumed inclusive in listed prices. Consult your tax advisor
          to confirm the applicable GST treatment for your business.
        </p>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Invoice — Order ${id}` }
}
