'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Args = {
  productId: number
  email: string
}

export async function subscribeToStockAlert({
  productId,
  email,
}: Args): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Enter a valid email address.' }
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const { totalDocs } = await payload.find({
      collection: 'stock-alerts',
      where: {
        and: [
          { product: { equals: productId } },
          { email: { equals: email } },
          { notifiedAt: { exists: false } },
        ],
      },
      limit: 0,
      overrideAccess: true,
    })

    if (totalDocs === 0) {
      await payload.create({
        collection: 'stock-alerts',
        data: { product: productId, email },
        overrideAccess: true,
      })
    }

    return { success: true }
  } catch (err) {
    payload.logger.error({ msg: 'Failed to subscribe to stock alert', err })
    return { success: false, error: 'Something went wrong — please try again.' }
  }
}
