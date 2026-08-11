import crypto from 'crypto'

const POSTSERVICE_URL: Record<'production' | 'test', string> = {
  production: 'https://info.payu.in/merchant/postservice.php?form=2',
  test: 'https://test.payu.in/merchant/postservice.php?form=2',
}

type PayuRefundResponse = {
  msg?: string
  request_id?: string
  status: number
}

/**
 * `amount` is already in paise, matching how `orders.amount`/`transactions.amount` are stored
 * throughout this app — PayU's refund API wants a decimal rupee string, so it's converted here.
 */
export async function refundPayuPayment(args: {
  amount: number
  paymentId: string // PayU's mihpayid
}): Promise<PayuRefundResponse> {
  const merchantKey = process.env.PAYU_MERCHANT_KEY
  const merchantSalt = process.env.PAYU_MERCHANT_SALT
  const mode: 'production' | 'test' = process.env.PAYU_MODE === 'production' ? 'production' : 'test'

  if (!merchantKey || !merchantSalt) {
    throw new Error('PAYU_MERCHANT_KEY / PAYU_MERCHANT_SALT are not configured.')
  }

  const command = 'cancel_refund_transaction'
  const var1 = args.paymentId
  const var2 = (args.amount / 100).toFixed(2)
  const hash = crypto
    .createHash('sha512')
    .update(`${merchantKey}|${command}|${var1}|${merchantSalt}`)
    .digest('hex')

  const body = new URLSearchParams({ command, hash, key: merchantKey, var1, var2 })

  const response = await fetch(POSTSERVICE_URL[mode], {
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })

  const result = (await response.json()) as PayuRefundResponse

  if (result.status !== 1) {
    throw new Error(result.msg || 'PayU refund failed.')
  }

  return result
}
