import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { Endpoint, PayloadRequest } from 'payload'
import crypto from 'crypto'
import { decrementInventoryForOrderItems } from '@/lib/inventory'

type WebhookEndpointProps = {
  confirmOrder: PaymentAdapter['confirmOrder']
  webhookSigningKey: string
}

/**
 * Fallback confirmation path for Zoho Payments — the primary path is the client calling
 * `/api/payments/zoho/confirm-order` right after the widget's requestPaymentMethod() resolves
 * (see src/components/checkout/CheckoutPage.tsx's payWithZoho). This webhook exists for the case
 * Zoho's own docs call out: the customer closes the widget or loses network right after paying,
 * so the client never gets to call confirm-order itself.
 *
 * Unlike the generic confirm-order endpoint, this bypasses the plugin's automatic inventory
 * decrement (it isn't reached through that handler), so it does so manually here — same as
 * src/payments/payu/endpoints/callback.ts. confirmOrder's own idempotency guard makes it safe for
 * this to run after (or before) the client-triggered confirm for the same payment.
 */
export const webhookEndpoint = (props: WebhookEndpointProps): Endpoint => {
  const { confirmOrder, webhookSigningKey } = props

  const verifySignature = (rawBody: string, header: string | null): boolean => {
    if (!header) return false
    const parts = Object.fromEntries(
      header.split(',').map((part) => {
        const [key, value] = part.split('=')
        return [key?.trim(), value?.trim()]
      }),
    )
    const timestamp = parts.t
    const receivedSignature = parts.v
    if (!timestamp || !receivedSignature) return false

    const expectedSignature = crypto
      .createHmac('sha256', webhookSigningKey)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    if (expectedSignature.length !== receivedSignature.length) return false
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature))
  }

  const handler = async (req: PayloadRequest): Promise<Response> => {
    const rawBody = (await req.text?.()) ?? ''
    const signatureHeader = req.headers.get('x-zoho-webhook-signature')

    if (!verifySignature(rawBody, signatureHeader)) {
      req.payload.logger.error({ msg: 'Zoho Payments webhook signature verification failed' })
      return Response.json({ message: 'Invalid signature' }, { status: 401 })
    }

    let body: { payment_id?: string; status?: string } = {}
    try {
      body = JSON.parse(rawBody)
    } catch {
      return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    // Only success-type payloads carry a payment worth confirming — anything else (a
    // notification about a refund, a failed attempt, etc.) is a no-op here.
    if (!body.payment_id || body.status !== 'succeeded') {
      return Response.json({ message: 'Ignored' }, { status: 200 })
    }

    try {
      const result = await confirmOrder({
        cartsSlug: 'carts',
        customersSlug: 'users',
        data: { paymentID: body.payment_id },
        ordersSlug: 'orders',
        req,
        transactionsSlug: 'transactions',
      })

      if (result.transactionID && !result.alreadyConfirmed) {
        const transaction = await req.payload.findByID({
          id: result.transactionID,
          collection: 'transactions',
          depth: 0,
          select: { id: true, items: true },
        })

        await decrementInventoryForOrderItems(req.payload, transaction?.items)
      }
    } catch (error) {
      // Best-effort fallback, not the primary confirmation path — log and still return 200 so
      // Zoho doesn't spend its 2-day retry budget on a payment the client path may have already
      // confirmed (or that genuinely failed verification, which is already logged inside
      // confirmOrder).
      req.payload.logger.error({ err: error, msg: 'Zoho Payments webhook confirmation failed' })
    }

    return Response.json({ message: 'ok' }, { status: 200 })
  }

  return {
    handler,
    method: 'post',
    path: '/webhook',
  }
}
