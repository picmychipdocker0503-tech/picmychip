import type { CollectionAfterChangeHook } from 'payload'

import { invoiceReadyEmailHtml, orderConfirmationEmailHtml, sendMail, shippingUpdateEmailHtml } from '@/lib/email'

const normalize = (value?: string | null) => (value || '').trim().toLowerCase()

export const sendOrderLifecycleEmails: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const orderedByEmail: string | undefined =
    doc.customerEmail || (typeof doc.customer === 'object' ? doc.customer?.email : undefined)

  if (!orderedByEmail) return doc

  // The billing address's own email (see AddressForm — defaults to the
  // account's login email, but is editable for a different contact) is a
  // second, independent recipient whenever it's actually different — e.g. a
  // business account ordering on behalf of a colleague whose own email
  // should also see order updates. Both emails clearly label who placed the
  // order versus who the billing contact is (see orderConfirmationEmailHtml)
  // so neither recipient is left guessing.
  const billingContactEmail: string | undefined = doc.billingAddress?.email || undefined
  const billingContactName: string | undefined =
    [doc.billingAddress?.firstName, doc.billingAddress?.lastName].filter(Boolean).join(' ') || undefined
  const sendToBillingToo = Boolean(
    billingContactEmail && normalize(billingContactEmail) !== normalize(orderedByEmail),
  )

  const recipients: { email: string; eventSuffix: string }[] = [{ email: orderedByEmail, eventSuffix: 'ACCOUNT' }]
  if (sendToBillingToo && billingContactEmail) {
    recipients.push({ email: billingContactEmail, eventSuffix: 'BILLING' })
  }

  if (operation === 'create') {
    const html = orderConfirmationEmailHtml({ ...doc, orderedByEmail, billingContactName, billingContactEmail })
    for (const recipient of recipients) {
      await sendMail(req.payload, {
        to: recipient.email,
        subject: `Order confirmed — #${doc.id}`,
        html,
        emailType: 'ORDER_CONFIRMATION',
        eventId: `ORDER_CONFIRMATION_${doc.id}_${recipient.eventSuffix}`,
      })
    }
    return doc
  }

  // invoiceSyncStatus flips to 'completed' both when the admin's own "Accept"
  // action converts the sales order, and when syncZohoSalesOrder's
  // applyLinkedInvoice detects it was converted directly in Zoho Books —
  // either way, this is the first moment a real invoice exists to tell the
  // customer about.
  const invoiceJustReady =
    doc.invoiceSyncStatus === 'completed' &&
    Boolean(doc.zohoInvoiceNumber) &&
    previousDoc?.invoiceSyncStatus !== 'completed'

  if (invoiceJustReady) {
    const html = invoiceReadyEmailHtml({
      id: doc.id,
      invoiceNumber: doc.zohoInvoiceNumber,
      invoiceUrl: doc.zohoInvoiceUrl,
    })
    for (const recipient of recipients) {
      await sendMail(req.payload, {
        to: recipient.email,
        subject: `Invoice ready for order #${doc.id}`,
        html,
        emailType: 'INVOICE_READY',
        eventId: `INVOICE_READY_${doc.id}_${recipient.eventSuffix}`,
      })
    }
  }

  // Fires once either the tracking number or the courier name first appears
  // — an admin may fill in courier details before the tracking number is
  // known (or vice versa), and either one is worth notifying the customer
  // about on its own, not just a trackingNumber change specifically.
  const trackingJustAdded = Boolean(doc.trackingNumber) && doc.trackingNumber !== previousDoc?.trackingNumber
  const courierJustAdded = Boolean(doc.courierName) && doc.courierName !== previousDoc?.courierName
  const justCompleted = doc.status === 'completed' && previousDoc?.status !== 'completed'

  if (trackingJustAdded || courierJustAdded || justCompleted) {
    const html = shippingUpdateEmailHtml({ ...doc, orderedByEmail, billingContactName, billingContactEmail })
    for (const recipient of recipients) {
      await sendMail(req.payload, {
        to: recipient.email,
        subject: `Shipping update for order #${doc.id}`,
        html,
        emailType: 'SHIPPING_UPDATE',
        eventId: `SHIPPING_UPDATE_${doc.id}_${doc.trackingNumber || doc.courierName || 'completed'}_${recipient.eventSuffix}`,
      })
    }
  }

  return doc
}
