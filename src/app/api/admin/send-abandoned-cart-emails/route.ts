import { checkRole } from '@/access/utilities'
import { sendAbandonedCartEmails } from '@/lib/sendAbandonedCartEmails'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/**
 * Admin-only manual trigger for the abandoned-cart recovery email run —
 * reuses the exact same logic the external-cron webhook route calls
 * (/api/send-abandoned-cart-emails), so admins have a way to run it without
 * depending on that cron being configured.
 */
export async function POST() {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!checkRole(['admin'], user)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const result = await sendAbandonedCartEmails(payload)

  return NextResponse.json(result)
}
