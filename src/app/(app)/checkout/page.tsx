import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React, { Fragment, Suspense } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'
import { getCheckoutShippingMethods } from '@/lib/checkoutShipping'

export default async function Checkout() {
  const siteSettings = await getCachedGlobal('site-settings', 0)()
  const tax = siteSettings?.taxSettings
  const shippingMethods = getCheckoutShippingMethods(siteSettings?.shippingSettings ?? undefined)

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
        <CheckoutPage
          businessState={tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka'}
          defaultGstPercent={tax?.gstRatePercent ?? 18}
          shippingMethods={shippingMethods}
        />
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
