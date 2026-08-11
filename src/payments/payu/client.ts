import type { PaymentAdapterClient, PaymentAdapterClientArgs } from '@payloadcms/plugin-ecommerce/types'

/**
 * Client-side registration for `EcommerceProvider`'s `paymentMethods` prop. `confirmOrder: false`
 * because the client never calls it for PayU — confirmation happens server-side via PayU's
 * surl/furl callback (see ../endpoints/callback.ts), not a client-initiated fetch like
 * Stripe/Razorpay. Kept in its own file so the client bundle never needs to know about the
 * server-only adapter code in ../index.ts.
 */
export const payuAdapterClient = (props?: PaymentAdapterClientArgs): PaymentAdapterClient => {
  return {
    name: 'payu',
    confirmOrder: false,
    initiatePayment: true,
    label: props?.label || 'Card / UPI / NetBanking',
  }
}
