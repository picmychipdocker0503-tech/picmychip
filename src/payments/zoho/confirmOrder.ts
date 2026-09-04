import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { Address } from '@/payload-types'
import { getCheckoutShippingMethod } from '@/lib/checkoutShipping'
import { zohoPaymentsFetch } from '@/lib/zoho/paymentsAuth'

type ZohoPaymentResponse = {
  payment: {
    amount: string
    currency: string
    payment_id: string
    payments_session_id: string
    status: string
  }
}

/**
 * Called either by the plugin's generic `/api/payments/zoho/confirm-order` endpoint (the normal
 * path — the client calls this right after the Zoho Payments widget's requestPaymentMethod()
 * resolves) or directly by this adapter's own webhook endpoint (fallback path). Never trusts a
 * client-supplied status: retrieves the payment from Zoho's API by ID and verifies its status,
 * amount, and currency itself — mirrors the plugin's built-in Stripe adapter, which does the same
 * via stripe.paymentIntents.retrieve() rather than trusting the client.
 */
export const confirmOrder: PaymentAdapter['confirmOrder'] = async ({
  cartsSlug = 'carts',
  data,
  ordersSlug = 'orders',
  req,
  transactionsSlug = 'transactions',
}) => {
  const payload = req.payload
  const paymentID = data.paymentID as string | undefined

  if (!paymentID || typeof paymentID !== 'string') {
    throw new Error('Missing Zoho Payments payment ID.')
  }

  const { payment } = await zohoPaymentsFetch<ZohoPaymentResponse>(`/api/v1/payments/${paymentID}`)

  const transactionsResult = await payload.find({
    collection: transactionsSlug as 'transactions',
    depth: 0,
    req,
    where: {
      'zoho.paymentsSessionID': { equals: payment.payments_session_id },
    },
  })

  const transaction = transactionsResult.docs[0]

  if (!transactionsResult.totalDocs || !transaction) {
    throw new Error('No transaction found for the provided Zoho Payments session.')
  }

  // Idempotency guard — the client-triggered confirm and the webhook fallback can both fire for
  // the same payment, and this must only decrement inventory / create the order once.
  if (transaction.status === 'succeeded' && transaction.order) {
    const existingOrderID = typeof transaction.order === 'object' ? transaction.order.id : transaction.order
    return {
      alreadyConfirmed: true,
      message: 'Payment already confirmed',
      orderID: existingOrderID,
      transactionID: transaction.id,
    }
  }

  if (payment.status !== 'succeeded') {
    await payload.update({
      id: transaction.id,
      collection: transactionsSlug as 'transactions',
      data: {
        status: 'failed',
        zoho: { ...transaction.zoho, paymentID: payment.payment_id, status: payment.status },
      },
      req,
    })
    throw new Error(`Payment ${payment.status}.`)
  }

  // Defense-in-depth: confirm the retrieved amount (rupees) matches what we actually charged
  // (paise), and that it's still an INR payment.
  if (payment.currency !== 'INR' || Math.round(Number(payment.amount) * 100) !== transaction.amount) {
    throw new Error('Payment amount does not match the expected order amount.')
  }

  const customer = typeof transaction.customer === 'object' ? transaction.customer?.id : transaction.customer
  const shippingSnapshot = (transaction.zoho?.shippingAddressSnapshot ?? undefined) as
    | (Address & { shippingMethod?: string; shippingAmount?: number })
    | undefined
  const { shippingMethod: snapshotShippingMethod, shippingAmount: snapshotShippingAmount, ...shippingAddress } =
    shippingSnapshot ?? {}
  const shippingMethod = transaction.shippingMethod || snapshotShippingMethod
  const shippingAmount =
    typeof transaction.shippingAmount === 'number' ? transaction.shippingAmount : snapshotShippingAmount
  const validShippingMethod = getCheckoutShippingMethod(shippingMethod)?.id

  const order = await payload.create({
    collection: ordersSlug as 'orders',
    data: {
      amount: transaction.amount,
      currency: transaction.currency,
      ...(customer ? { customer } : { customerEmail: transaction.customerEmail }),
      items: transaction.items,
      shippingAddress: Object.keys(shippingAddress).length ? (shippingAddress as Address) : undefined,
      billingAddress: transaction.billingAddress,
      ...(transaction.businessDetails ? { businessDetails: transaction.businessDetails } : {}),
      ...(validShippingMethod ? { shippingMethod: validShippingMethod } : {}),
      ...(typeof shippingAmount === 'number' ? { shippingAmount } : {}),
      status: 'processing',
      transactions: [transaction.id],
    },
    req,
  })

  const cartID = typeof transaction.cart === 'object' ? transaction.cart?.id : transaction.cart

  if (cartID) {
    await payload.update({
      id: cartID,
      collection: cartsSlug as 'carts',
      data: { purchasedAt: new Date().toISOString() },
      req,
    })
  }

  await payload.update({
    id: transaction.id,
    collection: transactionsSlug as 'transactions',
    data: {
      order: order.id,
      status: 'succeeded',
      zoho: { ...transaction.zoho, paymentID: payment.payment_id, status: 'succeeded' },
    },
    req,
  })

  return {
    message: 'Payment confirmed successfully',
    orderID: order.id,
    transactionID: transaction.id,
    ...(order.accessToken ? { accessToken: order.accessToken } : {}),
  }
}
