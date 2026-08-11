import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import type { Endpoint, PayloadRequest } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

type CallbackEndpointProps = {
  confirmOrder: PaymentAdapter['confirmOrder']
}

/**
 * PayU's surl and furl both point here (see initiatePayment.ts) — PayU POSTs the payment result
 * as application/x-www-form-urlencoded, a real browser navigation rather than a fetch, so this
 * responds with an HTTP redirect back into the app instead of JSON. The verified `status` field
 * decides success/failure, not which URL PayU happened to hit.
 *
 * Also performs the inventory decrement that the ecommerce plugin's own generic
 * `/api/payments/{name}/confirm-order` endpoint normally does after a client-initiated
 * confirmation — bypassed here since PayU never calls that JSON endpoint directly.
 */
export const callbackEndpoint = (props: CallbackEndpointProps): Endpoint => {
  const { confirmOrder } = props

  const handler = async (req: PayloadRequest): Promise<Response> => {
    const siteURL = getServerSideURL()
    const bodyText = (await req.text?.()) ?? ''
    const params = new URLSearchParams(bodyText)
    const data: Record<string, string> = {}
    for (const [key, value] of params.entries()) data[key] = value

    try {
      const result = await confirmOrder({
        cartsSlug: 'carts',
        customersSlug: 'users',
        data,
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

        if (transaction && Array.isArray(transaction.items)) {
          for (const item of transaction.items) {
            if (item.variant) {
              const id = typeof item.variant === 'object' ? item.variant.id : item.variant
              await req.payload.db.updateOne({
                id,
                collection: 'variants',
                data: { inventory: { $inc: item.quantity * -1 } },
              })
            } else if (item.product) {
              const id = typeof item.product === 'object' ? item.product.id : item.product
              await req.payload.db.updateOne({
                id,
                collection: 'products',
                data: { inventory: { $inc: item.quantity * -1 } },
              })
            }
          }
        }
      }

      const query = new URLSearchParams()
      if (data.email) query.set('email', data.email)
      if ('accessToken' in result && result.accessToken) query.set('accessToken', String(result.accessToken))

      const queryString = query.toString()
      return Response.redirect(
        `${siteURL}/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`,
        302,
      )
    } catch (error) {
      req.payload.logger.error({ err: error, msg: 'PayU payment confirmation failed' })
      return Response.redirect(`${siteURL}/checkout?error=payment_failed`, 302)
    }
  }

  return {
    handler,
    method: 'post',
    path: '/callback',
  }
}
