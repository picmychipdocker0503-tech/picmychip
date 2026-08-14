import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { Address } from '@/payload-types'
import { scheduleZohoSalesOrderSync } from '@/hooks/createZohoSalesOrder'
import crypto from 'crypto'

type ConfirmOrderProps = {
  merchantKey: string
  merchantSalt: string
}

const verifyReverseHash = (args: {
  amount: string
  email: string
  firstname: string
  hash: string
  merchantKey: string
  merchantSalt: string
  productinfo: string
  status: string
  txnid: string
  udf1: string
}): boolean => {
  const { amount, email, firstname, hash, merchantKey, merchantSalt, productinfo, status, txnid, udf1 } = args

  const parts = [
    merchantSalt,
    status,
    '',
    '',
    '',
    '',
    '', // 5 reserved empty fields
    '', // udf5
    '', // udf4
    '', // udf3
    '', // udf2
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    merchantKey,
  ]

  const expected = crypto.createHash('sha512').update(parts.join('|')).digest('hex')
  return expected === hash.toLowerCase()
}

/**
 * Called directly by the PayU callback endpoint (endpoints/callback.ts) after it parses PayU's
 * form-POSTed surl/furl response — never by the client, unlike Stripe/Razorpay's confirmOrder.
 * Verifies the reverse hash, then creates the order from whatever `initiatePayment` already
 * stashed on the `transactions` doc (PayU's callback carries no cart/item data of its own).
 */
export const confirmOrder =
  (props: ConfirmOrderProps): PaymentAdapter['confirmOrder'] =>
  async ({ cartsSlug = 'carts', data, ordersSlug = 'orders', req, transactionsSlug = 'transactions' }) => {
    const payload = req.payload
    const { merchantKey, merchantSalt } = props
    const { amount, email, firstname, hash, mihpayid, productinfo, status, txnid, udf1 } = data as Record<
      string,
      string
    >

    if (!txnid || !hash || !status) {
      throw new Error('Missing PayU payment confirmation data.')
    }

    const isValid = verifyReverseHash({
      amount: amount ?? '',
      email: email ?? '',
      firstname: firstname ?? '',
      hash,
      merchantKey,
      merchantSalt,
      productinfo: productinfo ?? '',
      status,
      txnid,
      udf1: udf1 ?? '',
    })

    if (!isValid) {
      throw new Error('Payment response hash verification failed.')
    }

    const transactionsResult = await payload.find({
      collection: transactionsSlug as 'transactions',
      depth: 0,
      req,
      where: {
        'payu.txnid': { equals: txnid },
      },
    })

    const transaction = transactionsResult.docs[0]

    if (!transactionsResult.totalDocs || !transaction) {
      throw new Error('No transaction found for the provided PayU transaction ID.')
    }

    // Idempotency guard — PayU can POST the same callback more than once (retry, duplicate
    // notification, reloaded browser tab). Without this, a repeat call would try to re-create
    // the order and re-decrement inventory for a payment already confirmed.
    if (transaction.status === 'succeeded' && transaction.order) {
      const existingOrderID = typeof transaction.order === 'object' ? transaction.order.id : transaction.order
      return {
        // The callback endpoint checks this before decrementing inventory — that must only
        // happen once, on the original confirm, not on a repeat/duplicate callback.
        alreadyConfirmed: true,
        message: 'Payment already confirmed',
        orderID: existingOrderID,
        transactionID: transaction.id,
      }
    }

    if (status !== 'success') {
      await payload.update({
        id: transaction.id,
        collection: transactionsSlug as 'transactions',
        data: {
          payu: { ...transaction.payu, mihpayid, status },
          status: 'failed',
        },
        req,
      })
      throw new Error(`Payment ${status}.`)
    }

    // Defense-in-depth: confirm the echoed amount (rupees) matches what we actually charged (paise).
    if (Math.round(Number(amount) * 100) !== transaction.amount) {
      throw new Error('Payment amount does not match the expected order amount.')
    }

    const customer =
      typeof transaction.customer === 'object' ? transaction.customer?.id : transaction.customer

    const order = await payload.create({
      collection: ordersSlug as 'orders',
      data: {
        amount: transaction.amount,
        currency: transaction.currency,
        ...(customer ? { customer } : { customerEmail: transaction.customerEmail }),
        items: transaction.items,
        shippingAddress: (transaction.payu?.shippingAddressSnapshot ?? undefined) as Address | undefined,
        billingAddress: transaction.billingAddress,
        ...(transaction.businessDetails ? { businessDetails: transaction.businessDetails } : {}),
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
        payu: { ...transaction.payu, mihpayid, status: 'success' },
        status: 'succeeded',
      },
      req,
    })

    scheduleZohoSalesOrderSync(req, order.id)

    return {
      message: 'Payment confirmed successfully',
      orderID: order.id,
      transactionID: transaction.id,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }
  }
