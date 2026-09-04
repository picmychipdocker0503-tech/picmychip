declare global {
  interface Window {
    ZPayments?: new (config: {
      account_id: string
      domain: string
      otherOptions: { api_key: string }
    }) => ZohoPaymentsInstance
  }
}

export type ZohoPaymentsInstance = {
  close: () => Promise<void>
  requestPaymentMethod: (options: {
    address?: { email?: string; name?: string; phone?: string }
    amount: string
    business: string
    currency_code: string
    currency_symbol: string
    description: string
    invoice_number?: string
    payments_session_id: string
    transaction_type: 'payment'
  }) => Promise<{ payment_id: string }>
}

const WIDGET_SCRIPT_SRC = 'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js'

let widgetScriptPromise: Promise<void> | null = null

/**
 * Loads Zoho Payments' checkout widget script exactly once, lazily — only when a customer
 * actually picks Zoho Payments at checkout (see CheckoutPage.tsx's payWithZoho), so PayU/COD
 * checkouts never pull in a third-party script they don't need.
 */
function loadWidgetScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Zoho Payments widget can only be loaded in the browser.'))
  }
  if (window.ZPayments) return Promise.resolve()
  if (widgetScriptPromise) return widgetScriptPromise

  widgetScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = WIDGET_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      widgetScriptPromise = null
      reject(new Error('Failed to load the Zoho Payments widget script.'))
    }
    document.body.appendChild(script)
  })

  return widgetScriptPromise
}

export async function createZohoPaymentsInstance(config: {
  accountId: string
  apiKey: string
  domain: string
}): Promise<ZohoPaymentsInstance> {
  await loadWidgetScript()
  if (!window.ZPayments) {
    throw new Error('Zoho Payments widget script loaded but window.ZPayments is unavailable.')
  }
  return new window.ZPayments({
    account_id: config.accountId,
    domain: config.domain,
    otherOptions: { api_key: config.apiKey },
  })
}
