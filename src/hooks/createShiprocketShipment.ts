import type { CollectionAfterChangeHook } from 'payload'

import { createShiprocketOrder, shiprocketIsConfigured } from '@/lib/shiprocket'
import { formatDateTime } from '@/utilities/formatDateTime'

/**
 * Auto-books the shipment with Shiprocket as soon as a paid/COD order is
 * created, so it appears in the Shiprocket dashboard ready for pickup —
 * mirrors the "read doc, then payload.update()" pattern used by the other
 * order afterChange hooks (see applyOrderDiscountSideEffects). Setting
 * `trackingNumber` here piggybacks on sendOrderLifecycleEmails, which already
 * emails the customer whenever that field changes.
 *
 * No-ops entirely (not an error) until SHIPROCKET_* env vars are set, same
 * convention as the SMTP/R2 integrations.
 */
export const createShiprocketShipment: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !shiprocketIsConfigured) return doc
  if (!doc.shippingAddress || doc.status === 'cancelled') return doc

  try {
    const items = await Promise.all(
      (doc.items || []).map(async (item: any) => {
        const productId = typeof item.product === 'object' ? item.product?.id : item.product
        if (!productId) return null

        const product = await req.payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
          overrideAccess: true,
        })

        const priceField = 'priceInINR' as const

        return {
          name: product?.title || 'Product',
          sku: product?.slug || String(productId),
          quantity: item.quantity ?? 1,
          sellingPrice: (product as any)?.[priceField] ?? 0,
          weightGrams: (product?.weightInGrams ?? 50) * (item.quantity ?? 1),
        }
      }),
    )

    const validItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item))
    if (validItems.length === 0) return doc

    const totalWeightKg = Math.max(
      validItems.reduce((sum, item) => sum + item.weightGrams, 0) / 1000,
      0.05,
    )

    const address = doc.shippingAddress

    const result = await createShiprocketOrder({
      orderId: String(doc.id),
      orderDate: formatDateTime({ date: doc.createdAt || new Date().toISOString(), format: 'yyyy-MM-dd HH:mm' }),
      paymentMethod: doc.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      subTotal: doc.amount ?? 0,
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
        email: doc.customerEmail || '',
        phone: address.phone || '',
      },
    })

    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: {
        shiprocketOrderId: String(result.orderId),
        shiprocketShipmentId: String(result.shipmentId),
        ...(result.awbCode ? { trackingNumber: result.awbCode } : {}),
        ...(result.courierName ? { courierName: result.courierName } : {}),
        shipmentStatus: result.status,
      },
      overrideAccess: true,
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to create Shiprocket shipment', err, orderId: doc.id })
  }

  return doc
}
