import type { CollectionAfterChangeHook } from 'payload'

import { newsletterWelcomeEmailHtml } from '@/lib/email'
import { sendMarketingEmail } from '@/lib/email/emailService'

// Marketing email — deliberately calls sendMarketingEmail (Brevo only), NOT
// sendMail/sendTransactionalEmail, so it never falls back to ZeptoMail.
export const sendNewsletterWelcome: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const result = await sendMarketingEmail({
    to: doc.email,
    subject: "You're subscribed to the Picmychip newsletter",
    html: newsletterWelcomeEmailHtml(),
  })

  if (!result.success) {
    req.payload.logger.error({ msg: 'Failed to send newsletter welcome email', error: result.error, to: doc.email })
  }

  return doc
}
