import crypto from 'crypto'

import configPromise from '@payload-config'
import { accountActivationEmailHtml, sendMail } from '@/lib/email'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: string }
    const normalizedEmail = email?.trim().toLowerCase()

    if (!normalizedEmail) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const {
      docs: [user],
    } = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
      select: {
        id: true,
        email: true,
        name: true,
        _verified: true,
      },
    })

    if (!user || user._verified) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(20).toString('hex')
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        _verificationToken: token,
      },
      overrideAccess: true,
    })

    await sendMail(payload, {
      to: normalizedEmail,
      subject: 'Verify your Picmychip account',
      html: accountActivationEmailHtml({
        verificationUrl: `${getServerSideURL()}/verify-email?token=${token}`,
        name: user.name,
      }),
      emailType: 'PAYLOAD_AUTH',
      eventId: `VERIFY_EMAIL_RESEND_${user.id}_${token}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const payload = await getPayload({ config: configPromise }).catch(() => null)
    payload?.logger.error({ msg: 'Failed to resend verification email', err })
    return NextResponse.json({ message: 'Unable to send verification email right now.' }, { status: 500 })
  }
}
