import type { Payload } from 'payload'

// Aggregates over an in-memory window of recent orders rather than raw SQL —
// simple and fast enough for a typical store's catalog/order volume. If this
// ever needs to scale past a few thousand orders/window, swap the reduce
// below for a grouped SQL query against the same postgres adapter.
const ORDER_WINDOW_LIMIT = 1000
const RECENT_DAYS = 30
const TREND_DAYS = 14

const startOfDaysAgo = (days: number) => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date
}

const dayKey = (isoDate: string) => isoDate.slice(0, 10)

export type SalesReport = {
  averageOrderValue: number
  orderCount: number
  revenueByDay: { date: string; revenue: number }[]
  totalRevenue: number
}

export type InventoryReport = {
  lowStock: { id: number; inventory: number; lowStockThreshold: number; slug: string; title: string }[]
  lowStockCount: number
  outOfStockCount: number
}

export type TopProductsReport = {
  topCategories: { revenue: number; title: string; unitsSold: number }[]
  topProducts: { revenue: number; title: string; unitsSold: number }[]
}

export type CustomerActivityReport = {
  newCustomers: number
  returningCustomers: number
  topCustomers: { email: string; orderCount: number; totalSpent: number }[]
  totalCustomers: number
}

const nonCancelledOrders = async (payload: Payload) => {
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: ORDER_WINDOW_LIMIT,
    sort: '-createdAt',
    overrideAccess: true,
    where: { status: { not_in: ['cancelled', 'refunded'] } },
  })
  return docs
}

export async function getSalesReport(payload: Payload): Promise<SalesReport> {
  const orders = await nonCancelledOrders(payload)
  const since = startOfDaysAgo(RECENT_DAYS)
  const recentOrders = orders.filter((order) => new Date(order.createdAt) >= since)

  const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.amount ?? 0), 0)
  const orderCount = recentOrders.length

  const trendSince = startOfDaysAgo(TREND_DAYS)
  const byDay = new Map<string, number>()
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendSince)
    d.setDate(d.getDate() + i)
    byDay.set(dayKey(d.toISOString()), 0)
  }
  for (const order of orders) {
    if (new Date(order.createdAt) < trendSince) continue
    const key = dayKey(order.createdAt)
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + (order.amount ?? 0))
  }

  return {
    totalRevenue,
    orderCount,
    averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
    revenueByDay: Array.from(byDay.entries()).map(([date, revenue]) => ({ date, revenue })),
  }
}

export async function getInventoryReport(payload: Payload): Promise<InventoryReport> {
  const [{ totalDocs: outOfStockCount }, lowStockResult] = await Promise.all([
    payload.count({ collection: 'products', where: { stockStatus: { equals: 'out-of-stock' } }, overrideAccess: true }),
    payload.find({
      collection: 'products',
      depth: 0,
      limit: 25,
      sort: 'inventory',
      overrideAccess: true,
      where: { stockStatus: { equals: 'low-stock' } },
      select: { title: true, slug: true, inventory: true, lowStockThreshold: true },
    }),
  ])

  return {
    outOfStockCount,
    lowStockCount: lowStockResult.totalDocs,
    lowStock: lowStockResult.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      slug: doc.slug || '',
      inventory: doc.inventory ?? 0,
      lowStockThreshold: doc.lowStockThreshold ?? 5,
    })),
  }
}

export async function getTopProductsReport(payload: Payload): Promise<TopProductsReport> {
  const orders = await nonCancelledOrders(payload)

  const productAgg = new Map<number, { revenue: number; title: string; unitsSold: number }>()
  const categoryAgg = new Map<number, { revenue: number; title: string; unitsSold: number }>()

  for (const order of orders) {
    const priceField = 'priceInINR' as const

    for (const item of order.items || []) {
      const product = typeof item.product === 'object' ? item.product : undefined
      if (!product) continue

      const quantity = item.quantity ?? 0
      const variant = typeof item.variant === 'object' ? item.variant : undefined
      const unitPrice = (variant as any)?.[priceField] ?? (product as any)?.[priceField] ?? 0
      const lineRevenue = unitPrice * quantity

      const existing = productAgg.get(product.id) ?? { title: product.title, unitsSold: 0, revenue: 0 }
      existing.unitsSold += quantity
      existing.revenue += lineRevenue
      productAgg.set(product.id, existing)

      for (const category of product.categories || []) {
        const cat = typeof category === 'object' ? category : undefined
        if (!cat) continue
        const existingCat = categoryAgg.get(cat.id) ?? { title: cat.title, unitsSold: 0, revenue: 0 }
        existingCat.unitsSold += quantity
        existingCat.revenue += lineRevenue
        categoryAgg.set(cat.id, existingCat)
      }
    }
  }

  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 8)
  const topCategories = Array.from(categoryAgg.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  return { topProducts, topCategories }
}

export async function getCustomerActivityReport(payload: Payload): Promise<CustomerActivityReport> {
  const [orders, { totalDocs: totalCustomers }] = await Promise.all([
    nonCancelledOrders(payload),
    payload.count({ collection: 'users', where: { roles: { contains: 'customer' } }, overrideAccess: true }),
  ])

  const since = startOfDaysAgo(RECENT_DAYS)
  const newCustomersResult = await payload.count({
    collection: 'users',
    overrideAccess: true,
    where: { and: [{ roles: { contains: 'customer' } }, { createdAt: { greater_than_equal: since.toISOString() } }] },
  })

  const byCustomer = new Map<string, { email: string; orderCount: number; totalSpent: number }>()
  for (const order of orders) {
    const email = order.customerEmail || (typeof order.customer === 'object' ? order.customer?.email : undefined)
    if (!email) continue

    const existing = byCustomer.get(email) ?? { email, orderCount: 0, totalSpent: 0 }
    existing.orderCount += 1
    existing.totalSpent += order.amount ?? 0
    byCustomer.set(email, existing)
  }

  const returningCustomers = Array.from(byCustomer.values()).filter((c) => c.orderCount > 1).length
  const topCustomers = Array.from(byCustomer.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8)

  return {
    totalCustomers,
    newCustomers: newCustomersResult.totalDocs,
    returningCustomers,
    topCustomers,
  }
}
