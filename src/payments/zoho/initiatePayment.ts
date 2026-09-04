import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import { zohoPaymentsFetch, getZohoPaymentsAccountId } from '@/lib/zoho/paymentsAuth'
import { computeCheckoutTotal } from '@/lib/checkoutTax'
import { requireCheckoutShippingMethod } from '@/lib/checkoutShipping'

type InitiatePaymentProps = {
  accountId: string
  apiKey: string
  domain: string
}

type PaymentSessionResponse = {
  payments_session: {
    payments_session_id: string
  }
}

/**
 * Creates a Zoho Payments payment session and a `transactions` doc, then hands the client
 * everything it needs to drive the Zoho Payments JS widget (see
 * src/lib/loadZohoPaymentsWidget.ts) — unlike PayU, Zoho's widget renders in-page and hands
 * control back to this same page, so there's no server-side callback/redirect involved here.
 *
 * Amount/tax math mirrors src/payments/payu/initiatePayment.ts exactly (same GST-inclusive
 * total computed server-side from the cart, never trusting a client-sent amount).
 */
export const initiatePayment =
  (props: InitiatePaymentProps): PaymentAdapter['initiatePayment'] =>
  async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const { accountId, apiKey, domain } = props
    const { billingAddress, cart, currency, customerEmail, shippingAddress } = data

    if (!req.user) {
      throw new Error('Please log in to place an order.')
    }
    // See src/payments/payu/initiatePayment.ts for why businessDetails/shippingMethod are
    // read from req.data rather than the plugin's typed `data` (which drops extra keys).
    const requestData = req.data as Record<string, unknown> | undefined
    const businessDetails = requestData?.businessDetails as
      | { companyName?: string; gstin?: string; panNumber?: string }
      | undefined
    const shippingMethodId = requestData?.shippingMethod as string | undefined

    if (currency !== 'INR') {
      throw new Error('Card / UPI / NetBanking via Zoho Payments is only available for INR orders.')
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }
    if (!customerEmail || typeof customerEmail !== 'string') {
      throw new Error('A valid customer email is required to make a purchase.')
    }

    // cart.subtotal is a snapshot, only recomputed by applyTieredPricing/applyCartDiscounts
    // when the cart document itself is next saved — a price tier edited (or removed) in admin
    // after the cart was last touched would otherwise leave it stale until the customer changes
    // quantity again. Re-saving with its own unchanged items forces both hooks to re-run fresh
    // (in the same order they always run in), so the amount actually charged can never be stale.
    const refreshedCart = await payload.update({
      id: cart.id,
      collection: 'carts',
      data: { items: cart.items },
      req,
    })

    const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const tax = siteSettings?.taxSettings
    const defaultGstPercent = tax?.gstRatePercent ?? 18
    const businessState = tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka'
    const customerState = shippingAddress?.state || billingAddress?.state
    const shippingMethod = requireCheckoutShippingMethod(shippingMethodId, siteSettings?.shippingSettings ?? undefined)

    const { finalAmount } = await computeCheckoutTotal({
      payload,
      items: cart.items,
      baseSubtotal: refreshedCart.subtotal ?? 0,
      shippingAmount: shippingMethod.amount,
      businessState,
      customerState,
      defaultGstPercent,
    })
    const amountInPaise = Math.round(finalAmount)

    if (!amountInPaise || typeof amountInPaise !== 'number' || amountInPaise < 100) {
      throw new Error('A valid amount of at least ₹1 is required to initiate a payment.')
    }

    const flattenedCart = cart.items.map((item) => {
      const productID = typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined
      const { id: _id, product: _product, variant: _variant, ...customProperties } = item
      return {
        ...customProperties,
        product: productID,
        quantity: item.quantity,
        ...(variantID ? { variant: variantID } : {}),
      }
    })

    // Zoho's amount is a decimal rupee value, like PayU — converted here, back to paise in
    // confirmOrder when verifying the retrieved payment against the stored transaction.
    const amount = (amountInPaise / 100).toFixed(2)
    const description = `Order for cart ${cart.id}`.slice(0, 500)
    const customerName = (billingAddress?.firstName || 'Customer').slice(0, 60)
    const customerPhone = billingAddress?.phone || ''

    try {
      const sessionResponse = await zohoPaymentsFetch<PaymentSessionResponse>('/api/v1/paymentsessions', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          currency: 'INR',
          description,
          invoice_number: String(cart.id).slice(0, 50),
        }),
      })
      const paymentsSessionID = sessionResponse.payments_session.payments_session_id

      const transaction = await payload.create({
        collection: transactionsSlug as 'transactions',
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount: amountInPaise,
          billingAddress,
          ...(businessDetails ? { businessDetails } : {}),
          cart: cart.id,
          currency,
          items: flattenedCart,
          paymentMethod: 'zoho',
          shippingMethod: shippingMethod.id,
          shippingAmount: shippingMethod.amount,
          zoho: {
            paymentsSessionID,
            shippingAddressSnapshot: {
              ...(shippingAddress as unknown as Record<string, unknown>),
              shippingMethod: shippingMethod.id,
              shippingAmount: shippingMethod.amount,
            },
          },
          status: 'pending',
        },
        req,
      })

      return {
        accountId: accountId || getZohoPaymentsAccountId(),
        address: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        amount,
        apiKey,
        business: process.env.COMPANY_NAME || process.env.SITE_NAME || 'PicMyChip',
        currencyCode: 'INR',
        currencySymbol: '₹',
        description,
        domain,
        message: 'Payment initiated successfully',
        paymentsSessionID,
        transactionID: transaction.id,
      }
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Error initiating payment with Zoho Payments' })
      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }
