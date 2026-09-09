import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Auto-fills courierTrackingUrl from the selected courier's own
 * trackingUrlTemplate (see src/collections/Couriers.ts) + trackingNumber —
 * keeps the two in sync instead of relying on someone retyping the same URL
 * pattern by hand for every shipment. Overwrites on every save where both
 * courierName and trackingNumber are present, so this field is a derived
 * display value, not something to hand-edit.
 */
export const applyCourierTrackingUrl: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data?.courierName || !data?.trackingNumber) return data

  const courierId = typeof data.courierName === 'object' ? data.courierName?.id : data.courierName
  if (!courierId) return data

  try {
    const courier = await req.payload.findByID({
      collection: 'couriers',
      id: courierId,
      depth: 0,
      overrideAccess: true,
    })

    if (courier?.trackingUrlTemplate) {
      data.courierTrackingUrl = courier.trackingUrlTemplate.includes('{trackingNumber}')
        ? courier.trackingUrlTemplate.replace('{trackingNumber}', encodeURIComponent(data.trackingNumber))
        : courier.trackingUrlTemplate
    }
  } catch (err) {
    req.payload.logger.error({ msg: 'Failed to resolve courier tracking URL', err })
  }

  return data
}
