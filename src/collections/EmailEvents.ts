import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

/**
 * Audit log + idempotency store for the Brevo→ZeptoMail transactional email
 * fallback (src/lib/email/emailService.ts). One row per logical email event
 * (e.g. "ORDER_CONFIRMATION_12345") — checked before sending so a retried
 * hook or duplicate call never re-sends an email that already went out.
 */
export const EmailEvents: CollectionConfig = {
  slug: 'email-events',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    group: 'Sales',
    defaultColumns: ['emailEventId', 'emailType', 'recipient', 'status', 'primaryProvider', 'fallbackProvider', 'createdAt'],
    useAsTitle: 'emailEventId',
  },
  fields: [
    {
      name: 'emailEventId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Deterministic per logical email event, e.g. "ORDER_CONFIRMATION_12345" — the idempotency key.',
      },
    },
    {
      name: 'emailType',
      type: 'text',
      required: true,
    },
    {
      name: 'recipient',
      type: 'email',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'unknown',
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
        { label: 'Unknown (ambiguous timeout)', value: 'unknown' },
      ],
    },
    {
      name: 'primaryProvider',
      type: 'text',
      admin: { description: 'Set once the primary provider (Brevo) is actually attempted.' },
    },
    {
      name: 'fallbackProvider',
      type: 'text',
      admin: { description: 'Set only if the fallback provider (ZeptoMail) was attempted.' },
    },
    {
      name: 'providerMessageId',
      type: 'text',
    },
    {
      name: 'attemptCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'errorMessage',
      type: 'text',
      admin: {
        description: 'Truncated provider error text — never headers, tokens, or API keys.',
      },
    },
  ],
}
