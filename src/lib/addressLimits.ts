/**
 * Matches Zoho Books' own hard cap on each address subfield
 * ("...has less than 100 characters") — enforced here at typing time
 * (AddressForm) so a customer never types past what Zoho will actually
 * accept, and again as a safety net when building the Zoho payload
 * (src/lib/orderIntegrations/syncZohoSalesOrder.ts's toZohoAddress).
 */
export const ADDRESS_LINE_MAX_LENGTH = 100

/** Indian mobile numbers are 10 digits — matches the phone field's numeric-only input restriction. */
export const PHONE_MAX_LENGTH = 10
