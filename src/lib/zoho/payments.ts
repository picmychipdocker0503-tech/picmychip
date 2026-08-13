import { zohoFetch } from './auth'

type ZohoChartAccount = {
  account_id: string
  account_name: string
  account_type?: string
  is_active?: boolean
}

export type RecordCustomerPaymentArgs = {
  customerId: string
  invoiceId: string
  amount: number
  date: string // yyyy-mm-dd
  referenceNumber: string
  /**
   * Zoho's standard modes are check/cash/creditcard/banktransfer/
   * bankremittance/autotransaction/others, but a Zoho org can also configure
   * custom named modes (this org has one literally called "payu", confirmed
   * working against their live account) — passed straight through as a
   * string rather than a locked union, since which custom modes exist is
   * org-specific and not discoverable via the API (no name is returned by
   * GET /settings/paymentmodes, only opaque ids).
   */
  paymentMode: string
  /** "Deposit To" account (e.g. a specific bank account) — omit to leave it in Zoho's default "Undeposited Funds". */
  accountId?: string
  /** Exact Chart of Accounts name, e.g. "SBI-BKC". Used only when accountId is not set. */
  accountName?: string
}

let cachedDepositAccountId: { accountId?: string; accountName: string } | null = null

async function resolveDepositAccountId(accountName?: string): Promise<string | undefined> {
  const exactName = accountName?.trim()
  if (!exactName) return undefined

  if (cachedDepositAccountId?.accountName === exactName) {
    return cachedDepositAccountId.accountId
  }

  const data = await zohoFetch<{ chartofaccounts?: ZohoChartAccount[] }>('/chartofaccounts')
  const normalizedName = exactName.toLowerCase()
  const match = data.chartofaccounts?.find(
    (account) =>
      account.is_active !== false &&
      ['bank', 'cash'].includes(account.account_type || '') &&
      account.account_name.trim().toLowerCase() === normalizedName,
  )

  if (!match) {
    throw new Error(`Zoho deposit account not found in Chart of Accounts: ${exactName}`)
  }

  cachedDepositAccountId = { accountId: match.account_id, accountName: exactName }
  return match.account_id
}

/**
 * Records that an invoice has already been paid — this app charges 100%
 * upfront via PayU (or collects COD), so by the time an invoice is created
 * the money has already been received; without this, Zoho has no way to
 * know that, and the invoice sits with the full amount showing as "Balance
 * Due" even though the customer paid in full.
 */
export async function recordCustomerPayment(args: RecordCustomerPaymentArgs): Promise<void> {
  const accountId = args.accountId || (await resolveDepositAccountId(args.accountName))

  await zohoFetch('/customerpayments', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: args.customerId,
      payment_mode: args.paymentMode,
      amount: args.amount,
      date: args.date,
      reference_number: args.referenceNumber,
      account_id: accountId,
      invoices: [{ invoice_id: args.invoiceId, amount_applied: args.amount }],
    }),
  })
}
