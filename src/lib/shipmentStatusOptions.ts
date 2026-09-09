/**
 * Shared between the Orders shipmentStatus select field
 * (src/plugins/index.ts) and OrderIntegrationPanel's display of the current
 * value — one list so the two can never drift out of sync.
 */
export const SHIPMENT_STATUS_OPTIONS = [
  { label: 'Picked Up', value: 'picked-up' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Out for Delivery', value: 'out-for-delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'Failed Delivery Attempt', value: 'failed-delivery-attempt' },
  { label: 'Returned to Origin', value: 'returned-to-origin' },
]
