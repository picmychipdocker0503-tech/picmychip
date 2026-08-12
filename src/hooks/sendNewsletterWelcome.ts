import type { CollectionAfterChangeHook } from 'payload'

import { newsletterWelcomeEmailHtml, sendMail } from '@/lib/email'

export const sendNewsletterWelcome: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  await sendMail(req.payload, {
    to: doc.email,
    subject: "You're subscribed to the Picmychip newsletter",
    html: newsletterWelcomeEmailHtml(),
  })

  return doc
}
