'use server'

import { getPostHogClient } from '@/lib/posthog-server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'

type Args = {
  orderId: string
  email: string
  reason: string
  description?: string
}

export async function submitReturnRequest({
  orderId,
  email,
  reason,
  description,
}: Args): Promise<{ success: boolean; error?: string }> {
  if (!orderId || !email || !reason) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  try {
    const { docs } = await payload.find({
      collection: 'orders',
      where: { id: { equals: orderId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const order = docs[0]
    if (!order) {
      return { success: false, error: 'Order not found.' }
    }

    const ownedByUser = user && String(order.customer) === String(user.id)
    const matchesEmail = order.customerEmail && order.customerEmail.toLowerCase() === email.toLowerCase()

    if (!ownedByUser && !matchesEmail) {
      return { success: false, error: "We couldn't verify that order with that email address." }
    }

    await payload.create({
      collection: 'return-requests',
      data: {
        order: order.id,
        customerEmail: email,
        reason: reason as
          | 'damaged'
          | 'wrong-item'
          | 'not-as-described'
          | 'no-longer-needed'
          | 'other',
        description,
        status: 'requested',
      },
      overrideAccess: true,
    })

    const distinctId = user ? String(user.id) : email
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId,
      event: 'return_request_submitted',
      properties: {
        order_id: orderId,
        reason,
      },
    })
    await posthog.shutdown()

    return { success: true }
  } catch (err) {
    payload.logger.error({ msg: 'Failed to submit return request', err })
    return { success: false, error: 'Something went wrong — please try again.' }
  }
}
