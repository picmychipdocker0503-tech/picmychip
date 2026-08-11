import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React, { Fragment, Suspense } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

export default function Checkout() {
  return (
    <div className="container min-h-[90vh] flex">
      {!process.env.PAYU_MERCHANT_KEY && (
        <div>
          <Fragment>
            {'To enable checkout, you must '}
            <a
              href="https://onboarding.payu.in/signup"
              rel="noopener noreferrer"
              target="_blank"
            >
              obtain your PayU Merchant Key and Salt
            </a>
            {' then set them as environment variables. See the '}
            <a
              href="https://docs.payu.in/docs/generate-test-merchant-key-and-salt"
              rel="noopener noreferrer"
              target="_blank"
            >
              PayU test credentials guide
            </a>
            {' for more details.'}
          </Fragment>
        </div>
      )}

      <h1 className="sr-only">Checkout</h1>

      <Suspense>
        <CheckoutPage />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Checkout.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}
