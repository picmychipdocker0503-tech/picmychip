import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import crypto from 'crypto'
import { getServerSideURL } from '@/utilities/getURL'
import { computeCheckoutTotal } from '@/lib/checkoutTax'
import { requireCheckoutShippingMethod } from '@/lib/checkoutShipping'

type InitiatePaymentProps = {
  merchantKey: string
  merchantSalt: string
  mode: 'production' | 'test'
}

const POST_URL: Record<'production' | 'test', string> = {
  production: 'https://secure.payu.in/_payment',
  test: 'https://test.payu.in/_payment',
}

/**
 * Creates a `transactions` doc and computes the PayU request hash, then hands the client
 * everything it needs to build and submit the redirect form (see src/lib/redirectToPayU.ts) —
 * PayU has no JS SDK/modal, the browser navigates away to a PayU-hosted page entirely.
 *
 * PayU's `amount` field is a decimal rupee string ("18.00"), unlike every other amount field in
 * this app, which is stored in paise — converted explicitly here, and back again in confirmOrder.
 */
export const initiatePayment =
  (props: InitiatePaymentProps): PaymentAdapter['initiatePayment'] =>
  async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const { merchantKey, merchantSalt, mode } = props
    const { billingAddress, cart, currency, customerEmail, shippingAddress } = data

    if (!req.user) {
      throw new Error('Please log in to place an order.')
    }
    // businessDetails (GSTIN/company/PAN) and shippingMethod aren't part of the plugin's
    // typed `data` shape — initiatePaymentHandler rebuilds `data` from only 5 fixed fields
    // (billingAddress/cart/currency/customerEmail/shippingAddress), silently dropping any
    // extra keys the client sent in `additionalData`. The full original request body is
    // still on `req.data` though (set by `addDataAndFileToRequest` before the handler even
    // calls this adapter), so read the extra fields from there instead.
    const requestData = req.data as Record<string, unknown> | undefined
    const businessDetails = requestData?.businessDetails as
      | { companyName?: string; gstin?: string; panNumber?: string }
      | undefined
    const shippingMethodId = requestData?.shippingMethod as string | undefined

    if (currency !== 'INR') {
      throw new Error('Card / UPI / NetBanking payment via PayU is only available for INR orders.')
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }
    if (!customerEmail || typeof customerEmail !== 'string') {
      throw new Error('A valid customer email is required to make a purchase.')
    }

    // cart.subtotal is the GST-exclusive base subtotal (net of coupon/gift-card
    // discounts) — GST is added on top here to get the amount actually charged.
    const siteSettings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const tax = siteSettings?.taxSettings
    const defaultGstPercent = tax?.gstRatePercent ?? 18
    const businessState = tax?.businessState || process.env.ZOHO_BUSINESS_STATE || 'Karnataka'
    const customerState = shippingAddress?.state || billingAddress?.state
    const shippingMethod = requireCheckoutShippingMethod(shippingMethodId, siteSettings?.shippingSettings ?? undefined)

    const { finalAmount } = await computeCheckoutTotal({
      payload,
      items: cart.items,
      baseSubtotal: cart.subtotal ?? 0,
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
      // Deliberately drop `id` too — it's the cart item's own array-row id, and reusing it here
      // would make every `transactions_items` row collide with the cart's on a retry (the cart
      // doesn't change between attempts, so the id would be identical every time).
      const { id: _id, product: _product, variant: _variant, ...customProperties } = item
      return {
        ...customProperties,
        product: productID,
        quantity: item.quantity,
        ...(variantID ? { variant: variantID } : {}),
      }
    })

    const txnid = crypto.randomUUID().replace(/-/g, '').slice(0, 30)
    const amount = (amountInPaise / 100).toFixed(2)
    const productinfo = `Order for cart ${cart.id}`.slice(0, 100)
    const firstname = (billingAddress?.firstName || 'Customer').slice(0, 60)
    const phone = billingAddress?.phone || ''
    const udf1 = String(cart.id)

    const baseURL = getServerSideURL()
    const surl = `${baseURL}/api/payments/payu/callback`
    const furl = `${baseURL}/api/payments/payu/callback`

    const hashParts = [
      merchantKey,
      txnid,
      amount,
      productinfo,
      firstname,
      customerEmail,
      udf1,
      '', // udf2
      '', // udf3
      '', // udf4
      '', // udf5
      '',
      '',
      '',
      '',
      '', // 5 reserved empty fields
      merchantSalt,
    ]
    const hash = crypto.createHash('sha512').update(hashParts.join('|')).digest('hex')

    try {
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
          paymentMethod: 'payu',
          shippingMethod: shippingMethod.id,
          shippingAmount: shippingMethod.amount,
          payu: {
            txnid,
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
        amount,
        email: customerEmail,
        firstname,
        furl,
        hash,
        message: 'Payment initiated successfully',
        payuMerchantKey: merchantKey,
        phone,
        postUrl: POST_URL[mode],
        productinfo,
        surl,
        transactionID: transaction.id,
        txnid,
        udf1,
      }
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Error initiating payment with PayU' })
      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }
