import type { Payload } from 'payload';

export async function sendMail(
  payload: Payload,
  args: { to: string; subject: string; html: string },
): Promise<void> {
  try {
    await payload.sendEmail(args)
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send email', err, to: args.to, subject: args.subject })
  }
}

const wrapper = (title: string, bodyHtml: string) => `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <h1 style="font-size: 20px; margin-bottom: 16px;">${title}</h1>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #888;">Picmychip</p>
  </div>
`

export function orderConfirmationEmailHtml(order: {
  id: string | number
  amount?: number | null
  currency?: string | null
}): string {
  const amount = typeof order.amount === 'number' ? order.amount.toFixed(2) : '—'
  return wrapper(
    `Order confirmed — #${order.id}`,
    `<p>Thanks for your order! We've received it and it's now being processed.</p>
     <p><strong>Order total:</strong> ${order.currency || ''} ${amount}</p>
     <p>You can view your order status anytime from your account.</p>`,
  )
}

export function shippingUpdateEmailHtml(order: {
  id: string | number
  trackingNumber?: string | null
  status?: string | null
}): string {
  const trackingHtml = order.trackingNumber
    ? `<p><strong>Tracking number:</strong> ${order.trackingNumber}</p>`
    : ''
  return wrapper(
    `Your order #${order.id} has shipped`,
    `<p>Good news — there's an update on your order.</p>
     ${trackingHtml}
     <p><strong>Status:</strong> ${order.status || 'processing'}</p>`,
  )
}

export function backInStockEmailHtml(product: { title?: string | null; slug?: string | null }): string {
  return wrapper(
    `${product.title} is back in stock`,
    `<p>Good news — the product you were waiting for is available again.</p>
     <p><a href="https://Picmychip.com/products/${product.slug}">View product</a></p>`,
  )
}

export function abandonedCartEmailHtml(cart: {
  itemCount: number
  siteUrl: string
}): string {
  return wrapper(
    'You left something in your cart',
    `<p>Your cart with ${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'} is still saved — pick up right where you left off.</p>
     <p><a href="${cart.siteUrl}/cart">Return to cart</a></p>`,
  )
}

export function giftCardIssuedEmailHtml(giftCard: {
  code: string
  balance?: number | null
  currency?: string | null
}): string {
  return wrapper(
    'Your gift card is ready',
    `<p>Here's your gift card code — save it to redeem at checkout.</p>
     <p style="font-size: 20px; font-weight: 700; letter-spacing: 0.05em;">${giftCard.code}</p>
     <p><strong>Balance:</strong> ${giftCard.currency || ''} ${giftCard.balance ?? ''}</p>`,
  )
}
