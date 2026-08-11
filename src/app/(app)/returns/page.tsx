import type { Metadata } from 'next'

import { ReturnRequestForm } from '@/components/forms/ReturnRequestForm'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'

type Props = {
  searchParams: Promise<{ orderId?: string }>
}

export default async function ReturnsPage({ searchParams }: Props) {
  const { orderId } = await searchParams

  return (
    <div className="container flex flex-col gap-6 py-16">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Request a Return / Refund</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your order details below and we&apos;ll review your request.
        </p>
      </div>

      <div className="max-w-xl">
        <ReturnRequestForm defaultOrderId={orderId} />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Request a return or refund for your order.',
  openGraph: mergeOpenGraph({
    title: 'Returns',
    url: '/returns',
  }),
  title: 'Returns',
}
