import { getClientSideURL } from '@/utilities/getURL'

/**
 * The ecommerce plugin's useCart() only exposes incrementItem/decrementItem
 * (±1) and addItem (which always ADDS to an existing line's quantity, never
 * sets it) — no "set this line to exactly N" call. Its own increment/
 * decrement hit this same `update-item` endpoint under the hood with
 * `quantity: { $inc: 1 }`; the endpoint itself already accepts a plain number
 * to set the quantity directly (see the plugin's updateItem operation), so
 * this calls it the same way instead of simulating a typed number with a
 * pile of increment/decrement calls — or, worse, calling addItem and
 * doubling up an already-in-cart quantity.
 */
export async function setCartItemQuantity(args: {
  cartId: string | number
  itemId: string
  quantity: number
}): Promise<void> {
  const secret = window.localStorage.getItem('cart_secret') ?? undefined
  const res = await fetch(`${getClientSideURL()}/api/carts/${args.cartId}/update-item`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemID: args.itemId, quantity: args.quantity, secret }),
  })
  if (!res.ok) throw new Error('Failed to update quantity')
}
