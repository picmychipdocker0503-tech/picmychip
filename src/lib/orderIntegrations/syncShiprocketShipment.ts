import type { Payload } from 'payload'

import {
  assignAwb,
  cancelShiprocketOrder,
  createShiprocketOrder,
  getShiprocketShipmentStatus,
  shiprocketIsConfigured,
} from '@/lib/shiprocket'
import { formatDateTime } from '@/utilities/formatDateTime'

/**
 * Books (or re-books) the Shiprocket shipment for an order and writes the
 * result back onto it. Called both by the createShiprocketShipment
 * afterChange hook (automatic) and the admin "Retry shipment" endpoint
 * (manual) — idempotent (skips straight to a status refresh if a Shiprocket
 * order id is already on file) and never throws.
 */
export async function syncShiprocketShipmentForOrder(payload: Payload, orderId: number | string): Promise<void> {
  if (!shiprocketIsConfigured) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any
  try {
    order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  } catch (err) {
    payload.logger.error({ msg: 'syncShiprocketShipmentForOrder: order not found', err, orderId })
    return
  }

  if (!order || !order.shippingAddress || order.status === 'cancelled') return

  try {
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { shipmentSyncStatus: 'processing' },
      overrideAccess: true,
    })

    // Already booked — Shiprocket's adhoc-create endpoint is itself idempotent
    // on order_id, but skipping the call entirely on a known-good retry avoids
    // an unnecessary API round-trip and keeps this cheap to retry repeatedly.
    if (order.shiprocketShipmentId) {
      const status = await getShiprocketShipmentStatus(order.shiprocketShipmentId)
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          ...(status
            ? {
                shipmentStatus: status.currentStatus,
                shiprocketPickupStatus: status.pickupStatus,
                shiprocketDeliveryStatus: status.deliveryStatus,
                shiprocketEstimatedDeliveryDate: status.estimatedDeliveryDate,
              }
            : {}),
          shipmentSyncStatus: 'completed',
          integrationError: { ...order.integrationError, shipment: null },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      return
    }

    const items = await Promise.all(
      (order.items || []).map(async (item: any) => {
        const productId = typeof item.product === 'object' ? item.product?.id : item.product
        if (!productId) return null

        const product =
          typeof item.product === 'object' && item.product
            ? item.product
            : await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })

        return {
          name: product?.title || 'Product',
          sku: product?.sku || product?.slug || String(productId),
          quantity: item.quantity ?? 1,
          sellingPrice: (product?.priceInINR ?? 0) / 100,
          weightGrams: (product?.weightInGrams ?? 50) * (item.quantity ?? 1),
        }
      }),
    )

    const validItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item))
    if (validItems.length === 0) throw new Error('Order has no valid items to ship.')

    const totalWeightKg = Math.max(
      validItems.reduce((sum, item) => sum + item.weightGrams, 0) / 1000,
      0.05,
    )

    const address = order.shippingAddress

    const result = await createShiprocketOrder({
      orderId: String(order.id),
      orderDate: formatDateTime({ date: order.createdAt || new Date().toISOString(), format: 'yyyy-MM-dd HH:mm' }),
      paymentMethod: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      subTotal: (order.amount ?? 0) / 100,
      weightKg: totalWeightKg,
      items: validItems.map((item) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
      })),
      billing: {
        name: `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Customer',
        address: address.addressLine1 || '',
        address2: address.addressLine2 || undefined,
        city: address.city || '',
        state: address.state || '',
        pincode: address.postalCode || '',
        country: 'India',
        email: order.customerEmail || '',
        phone: address.phone || '',
      },
    })

    let awbCode = result.awbCode
    let courierName = result.courierName

    // The adhoc-create call doesn't always assign a courier/AWB synchronously —
    // request it explicitly if it didn't come back already assigned.
    if (!awbCode) {
      const assigned = await assignAwb(result.shipmentId).catch(() => null)
      if (assigned) {
        awbCode = assigned.awbCode
        courierName = assigned.courierName
      }
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        shiprocketOrderId: String(result.orderId),
        shiprocketShipmentId: String(result.shipmentId),
        ...(awbCode ? { trackingNumber: awbCode } : {}),
        ...(courierName ? { courierName } : {}),
        shipmentStatus: result.status,
        shipmentSyncStatus: 'completed',
        integrationError: { ...order.integrationError, shipment: null },
        lastSyncAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    payload.logger.error({ msg: 'Failed to sync Shiprocket shipment', err, orderId })
    await payload
      .update({
        collection: 'orders',
        id: orderId,
        data: {
          shipmentSyncStatus: 'failed',
          integrationError: { ...order?.integrationError, shipment: message },
          lastSyncAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      .catch(() => {})
  }
}

/**
 * Cancels the Shiprocket order for this ecommerce order, if one exists —
 * used by the admin "Cancel shipment" action. Only succeeds in Shiprocket if
 * the shipment hasn't been picked up yet.
 */
export async function cancelShiprocketShipmentForOrder(payload: Payload, orderId: number | string): Promise<void> {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })
  if (!order?.shiprocketOrderId) {
    throw new Error('No Shiprocket order to cancel for this order.')
  }

  await cancelShiprocketOrder(order.shiprocketOrderId)

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      shipmentStatus: 'Cancelled',
      lastSyncAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}
