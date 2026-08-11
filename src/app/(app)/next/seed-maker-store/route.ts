import { createLocalReq, getPayload } from 'payload'
import { seedMakerStore } from '@/endpoints/seed/makerStore'
import config from '@payload-config'
import { headers } from 'next/headers'

import { checkRole } from '@/access/utilities'

export const maxDuration = 300 // This function can run for a maximum of 300 seconds

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    const payloadReq = await createLocalReq({ user }, payload)

    const result = await seedMakerStore({ payload, req: payloadReq })

    return Response.json({ success: true, ...result })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding maker-store content' })
    return new Response('Error seeding maker-store content.', { status: 500 })
  }
}
