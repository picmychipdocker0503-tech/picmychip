const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

export const shiprocketIsConfigured = Boolean(
  process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD && process.env.SHIPROCKET_PICKUP_LOCATION,
)

// Shiprocket tokens are valid ~10 days. Caching in module scope avoids a
// login round-trip on every request — worst case (a cold serverless
// instance) just re-authenticates once.
let cachedToken: { expiresAt: number; token: string } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token

  const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!res.ok) {
    throw new Error(`Shiprocket auth failed: ${res.status} ${await res.text()}`)
  }

  const data = (await res.json()) as { token: string }
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 }
  return data.token
}

async function shiprocketFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()

  const res = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Shiprocket API error (${path}): ${res.status} ${JSON.stringify(data)}`)
  }

  return data as T
}

export type ServiceabilityOption = {
  courierCompanyId: number
  courierName: string
  estimatedDeliveryDays: string
  freightCharge: number
  rating: number
}

export type ServiceabilityResult = {
  options: ServiceabilityOption[]
  serviceable: boolean
}

/**
 * Checks which couriers deliver to a pincode and what they'd charge — used
 * at checkout to show an estimated shipping cost/ETA before the order is
 * placed. Does not create anything in Shiprocket.
 */
export async function checkServiceability(args: {
  codAmount?: number
  deliveryPostcode: string
  weightKg: number
}): Promise<ServiceabilityResult> {
  if (!shiprocketIsConfigured) {
    return { options: [], serviceable: false }
  }

  const params = new URLSearchParams({
    pickup_postcode: process.env.SHIPROCKET_PICKUP_PINCODE || '',
    delivery_postcode: args.deliveryPostcode,
    weight: args.weightKg.toFixed(2),
    cod: args.codAmount && args.codAmount > 0 ? '1' : '0',
  })

  const data = await shiprocketFetch<{
    data?: { available_courier_companies?: Record<string, unknown>[] }
  }>(`/courier/serviceability/?${params.toString()}`)

  const couriers = data.data?.available_courier_companies || []

  return {
    serviceable: couriers.length > 0,
    options: couriers.map((courier) => ({
      courierCompanyId: Number(courier.courier_company_id),
      courierName: String(courier.courier_name ?? 'Courier'),
      estimatedDeliveryDays: String(courier.estimated_delivery_days ?? courier.etd ?? ''),
      freightCharge: Number(courier.freight_charge ?? courier.rate ?? 0),
      rating: Number(courier.rating ?? 0),
    })),
  }
}

export type ShiprocketOrderItem = {
  name: string
  quantity: number
  sellingPrice: number
  sku: string
  units?: string
}

export type CreateShiprocketOrderArgs = {
  billing: {
    address: string
    address2?: string
    city: string
    country?: string
    email: string
    lastName?: string
    name: string
    phone: string
    pincode: string
    state: string
  }
  items: ShiprocketOrderItem[]
  orderDate: string // 'YYYY-MM-DD HH:mm'
  orderId: string
  paymentMethod: 'COD' | 'Prepaid'
  subTotal: number
  weightKg: number
}

export type CreateShiprocketOrderResult = {
  awbCode?: string
  courierName?: string
  orderId: number
  shipmentId: number
  status: string
}

/**
 * Creates the order in Shiprocket (adhoc — no pre-registered channel needed)
 * so it shows up in the Shiprocket dashboard for pickup scheduling. Shiprocket
 * auto-assigns the best-rated serviceable courier; the AWB (tracking number)
 * comes back once assigned, which can happen synchronously or a few seconds
 * later via the webhook.
 */
export async function createShiprocketOrder(
  args: CreateShiprocketOrderArgs,
): Promise<CreateShiprocketOrderResult> {
  const payload = {
    order_id: args.orderId,
    order_date: args.orderDate,
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: args.billing.name,
    billing_last_name: args.billing.lastName || '',
    billing_address: args.billing.address,
    billing_address_2: args.billing.address2 || '',
    billing_city: args.billing.city,
    billing_pincode: args.billing.pincode,
    billing_state: args.billing.state,
    billing_country: args.billing.country || 'India',
    billing_email: args.billing.email,
    billing_phone: args.billing.phone,
    shipping_is_billing: true,
    order_items: args.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.sellingPrice,
    })),
    payment_method: args.paymentMethod,
    sub_total: args.subTotal,
    length: 10,
    breadth: 10,
    height: 5,
    weight: args.weightKg,
  }

  const data = await shiprocketFetch<{
    awb_code?: string
    courier_name?: string
    order_id: number
    shipment_id: number
    status: string
  }>('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return {
    orderId: data.order_id,
    shipmentId: data.shipment_id,
    status: data.status,
    awbCode: data.awb_code || undefined,
    courierName: data.courier_name || undefined,
  }
}

export type ShipmentTrackingStatus = {
  currentStatus: string
  deliveredDate?: string
  trackingUrl?: string
}

export async function trackShipmentByAwb(awbCode: string): Promise<ShipmentTrackingStatus | null> {
  const data = await shiprocketFetch<{
    tracking_data?: {
      shipment_track?: { current_status?: string; delivered_date?: string }[]
      track_url?: string
    }
  }>(`/courier/track/awb/${awbCode}`)

  const track = data.tracking_data?.shipment_track?.[0]
  if (!track) return null

  return {
    currentStatus: track.current_status || 'Unknown',
    deliveredDate: track.delivered_date || undefined,
    trackingUrl: data.tracking_data?.track_url,
  }
}

export type AssignAwbResult = {
  awbCode: string
  courierName: string
}

/**
 * Explicitly assigns a courier + generates the AWB for a shipment. Usually
 * unnecessary — `createShiprocketOrder`'s adhoc create often auto-assigns one
 * synchronously — but this covers the case where it didn't (or a retry needs
 * to (re)request it).
 */
export async function assignAwb(shipmentId: number | string): Promise<AssignAwbResult | null> {
  const data = await shiprocketFetch<{
    response?: { data?: { awb_code?: string; courier_name?: string } }
  }>('/courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentId }),
  })

  const result = data.response?.data
  if (!result?.awb_code) return null

  return { awbCode: result.awb_code, courierName: result.courier_name || 'Courier' }
}

/**
 * Cancels the order in Shiprocket — only succeeds if it hasn't been picked up
 * yet. Used by the admin "Cancel shipment" action.
 */
export async function cancelShiprocketOrder(orderId: number | string): Promise<void> {
  await shiprocketFetch('/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ ids: [Number(orderId)] }),
  })
}

export type ShiprocketShipmentStatus = {
  currentStatus: string
  deliveryStatus?: string
  estimatedDeliveryDate?: string
  pickupStatus?: string
}

/**
 * Refreshes pickup/delivery status for a shipment by its Shiprocket shipment id
 * (not the AWB) — used by the "Retry shipment" admin action to pull the latest
 * status without needing an AWB to already be assigned.
 */
export async function getShiprocketShipmentStatus(
  shipmentId: number | string,
): Promise<ShiprocketShipmentStatus | null> {
  const data = await shiprocketFetch<{
    tracking_data?: {
      shipment_status?: string
      shipment_track?: { current_status?: string; delivered_date?: string; pickup_date?: string }[]
      etd?: string
    }
  }>(`/courier/track/shipment/${shipmentId}`)

  const track = data.tracking_data?.shipment_track?.[0]
  if (!track && !data.tracking_data?.shipment_status) return null

  return {
    currentStatus: track?.current_status || data.tracking_data?.shipment_status || 'Unknown',
    pickupStatus: track?.pickup_date ? 'Picked up' : undefined,
    deliveryStatus: track?.delivered_date ? 'Delivered' : undefined,
    estimatedDeliveryDate: data.tracking_data?.etd,
  }
}
