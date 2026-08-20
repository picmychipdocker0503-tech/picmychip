import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/ProductItem'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderStatus } from '@/components/OrderStatus'
import { OrderTrackingTimeline } from '@/components/OrderTrackingTimeline'
import { AddressItem } from '@/components/addresses/AddressItem'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 2,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : [
                {
                  accessToken: {
                    equals: accessToken,
                  },
                },
                ...(email
                  ? [
                      {
                        customerEmail: {
                          equals: email,
                        },
                      },
                    ]
                  : []),
              ]),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerEmail: true,
        customer: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
        trackingNumber: true,
        courierName: true,
        shipmentStatus: true,
        paymentMethod: true,
        couponApplied: true,
        giftCardApplied: true,
        zohoInvoiceId: true,
        invoiceSyncStatus: true,
      },
    })

    const canAccessAsGuest =
      !user &&
      email &&
      accessToken &&
      orderResult &&
      orderResult.customerEmail &&
      orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch (error) {
    console.error(error)
  }

  if (!order) {
    notFound()
  }

  return (
    <div className="">
      <div className="flex gap-8 justify-between items-center mb-6">
        {user ? (
          <div className="flex gap-4">
            <Button asChild variant="ghost">
              <Link href="/orders">
                <ChevronLeftIcon />
                All orders
              </Link>
            </Button>
          </div>
        ) : (
          <div></div>
        )}

        <h1 className="text-sm uppercase font-mono px-2 bg-primary/10 rounded tracking-[0.07em]">
          <span className="">{`Order #${order.id}`}</span>
        </h1>
      </div>

      <div className="bg-card border rounded-lg px-6 py-4 flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="">
            <p className="uppercase text-muted-foreground font-semibold tracking-wide mb-1 text-sm">Order Date</p>
            <p className="text-lg">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </div>

          <div className="">
            <p className="uppercase text-muted-foreground font-semibold tracking-wide mb-1 text-sm">Total</p>
            {order.amount && <Price className="text-lg" amount={order.amount} />}
          </div>

          {order.status && (
            <div className="grow max-w-1/3">
              <p className="uppercase text-muted-foreground font-semibold tracking-wide mb-1 text-sm">Status</p>
              <OrderStatus className="text-sm" status={order.status} />
            </div>
          )}

          <div className="">
            <p className="uppercase text-muted-foreground font-semibold tracking-wide mb-1 text-sm">Payment</p>
            <p className="text-lg capitalize">
              {order.paymentMethod === 'cod'
                ? 'Cash on Delivery'
                : order.paymentMethod === 'gift-card'
                  ? 'Gift Card'
                  : 'Card / UPI'}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-muted-foreground font-semibold tracking-wide mb-4 uppercase text-sm">Tracking</h2>
          <OrderTrackingTimeline
            status={order.status}
            trackingNumber={order.trackingNumber}
            courierName={order.courierName}
          />
        </div>

        {(order.couponApplied?.code || order.giftCardApplied?.code) && (
          <div>
            <h2 className="text-muted-foreground font-semibold tracking-wide mb-4 uppercase text-sm">Discounts Applied</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {order.couponApplied?.code && (
                <li>
                  Coupon <span className="font-medium">{order.couponApplied.code}</span> — saved{' '}
                  <Price amount={order.couponApplied.discountAmount ?? 0} as="span" />
                </li>
              )}
              {order.giftCardApplied?.code && (
                <li>
                  Gift card <span className="font-medium">{order.giftCardApplied.code}</span> — applied{' '}
                  <Price amount={order.giftCardApplied.amountApplied ?? 0} as="span" />
                </li>
              )}
            </ul>
          </div>
        )}

        {order.items && (
          <div>
            <h2 className="text-muted-foreground font-semibold tracking-wide mb-4 uppercase text-sm">Items</h2>
            <ul className="flex flex-col gap-6">
              {order.items?.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return <div key={index}>This item is no longer available.</div>
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li key={item.id}>
                    <ProductItem
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {order.shippingAddress && (
          <div>
            <h2 className="text-muted-foreground font-semibold tracking-wide mb-4 uppercase text-sm">Shipping Address</h2>

            {/* @ts-expect-error - some kind of type hell */}
            <AddressItem address={order.shippingAddress} hideActions />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={`/returns?orderId=${order.id}`}>Request a return / refund</Link>
          </Button>
          {order.zohoInvoiceId && order.invoiceSyncStatus === 'completed' ? (
            <Button asChild variant="outline">
              <Link href={`/orders/${order.id}/invoice`}>Download invoice</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Invoice pending
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}
