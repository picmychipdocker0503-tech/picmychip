export type PayuRedirectFields = {
  amount: string
  email: string
  firstname: string
  furl: string
  hash: string
  payuMerchantKey: string
  phone?: string
  postUrl: string
  productinfo: string
  surl: string
  txnid: string
  udf1?: string
}

/**
 * PayU has no JS SDK — the payment page is hosted entirely by PayU, reachable only via a real
 * HTML form POST (a fetch/XHR won't do; the browser has to navigate there). Builds a hidden form
 * from the fields `initiatePayment` returned and submits it immediately.
 */
export function redirectToPayU(fields: PayuRedirectFields): void {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = fields.postUrl
  form.style.display = 'none'

  const inputs: Record<string, string | undefined> = {
    amount: fields.amount,
    email: fields.email,
    firstname: fields.firstname,
    furl: fields.furl,
    hash: fields.hash,
    key: fields.payuMerchantKey,
    phone: fields.phone,
    productinfo: fields.productinfo,
    surl: fields.surl,
    txnid: fields.txnid,
    udf1: fields.udf1,
  }

  for (const [name, value] of Object.entries(inputs)) {
    if (value == null) continue
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}
