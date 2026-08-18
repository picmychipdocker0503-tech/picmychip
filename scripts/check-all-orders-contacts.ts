import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { zohoFetch } from '../src/lib/zoho/auth'

const run = async () => {
  const payload = await getPayload({ config })

  for (const id of [1, 2, 3, 4, 5, 6, 7]) {
    const order = await payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true })
    const billing = (order.billingAddress?.addressLine1 ? order.billingAddress : order.shippingAddress) as any
    const contactName = `${billing?.firstName || ''} ${billing?.lastName || ''}`.trim()
    payload.logger.info(
      `Order ${id}: email=${order.customerEmail} phone=${billing?.phone} contactName=${contactName} zohoCustomerId=${order.zohoCustomerId}`,
    )
  }

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
