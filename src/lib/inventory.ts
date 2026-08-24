import type { Payload } from 'payload'

type OrderItemLike = {
  product?: number | string | { id: number | string } | null
  variant?: number | string | { id: number | string } | null
  quantity?: number | null
}

async function adjustInventoryForOrderItems(
  payload: Payload,
  items: OrderItemLike[] | null | undefined,
  sign: 1 | -1,
): Promise<void> {
  if (!Array.isArray(items)) return

  for (const item of items) {
    const quantity = item.quantity
    if (!quantity) continue

    if (item.variant) {
      const id = typeof item.variant === 'object' ? item.variant.id : item.variant
      await payload.db.updateOne({
        id,
        collection: 'variants',
        data: { inventory: { $inc: quantity * sign } },
      })
    } else if (item.product) {
      const id = typeof item.product === 'object' ? item.product.id : item.product
      await payload.db.updateOne({
        id,
        collection: 'products',
        data: { inventory: { $inc: quantity * sign } },
      })
    }
  }
}

/**
 * Decrements product/variant inventory for each line item on an order.
 * Called once, at order creation, for every payment method — previously
 * only the PayU callback did this, so Cash on Delivery and fully
 * gift-card-covered orders (both created via checkout/place-order) never
 * reduced stock at all.
 */
export async function decrementInventoryForOrderItems(
  payload: Payload,
  items: OrderItemLike[] | null | undefined,
): Promise<void> {
  await adjustInventoryForOrderItems(payload, items, -1)
}

/**
 * Adds product/variant inventory back for each line item on an order — the
 * symmetric counterpart to decrementInventoryForOrderItems, called when an
 * order that was already decremented at placement is cancelled or refunded
 * before it ships. Without this, a cancelled order would leave stock
 * understated forever.
 */
export async function restoreInventoryForOrderItems(
  payload: Payload,
  items: OrderItemLike[] | null | undefined,
): Promise<void> {
  await adjustInventoryForOrderItems(payload, items, 1)
}
