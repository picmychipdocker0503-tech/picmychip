import { test, expect, Page } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testAdminUser } from '../helpers/seedUser'

const SEED_CODES = Array.from({ length: 25 }, (_, i) => `E2E-COUPON-${String(i + 1).padStart(2, '0')}`)

async function seedCoupons() {
  const payload = await getPayload({ config })
  await Promise.all(
    SEED_CODES.map((code, i) =>
      payload.create({
        collection: 'coupons',
        data: {
          code,
          type: 'percentage',
          value: (i % 20) + 1,
          active: true,
        },
        overrideAccess: true,
      }),
    ),
  )
}

async function cleanupCoupons() {
  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'coupons',
    where: { code: { like: 'E2E-COUPON-' } },
    overrideAccess: true,
  })
}

test.describe('Coupons TanStack list view', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90_000)
    await seedTestUser(testAdminUser, ['admin'])
    await seedCoupons()

    const context = await browser.newContext()
    page = await context.newPage()
    await login({ page, user: testAdminUser })
  })

  test.afterAll(async () => {
    test.setTimeout(90_000)
    await cleanupCoupons()
    await cleanupTestUser(testAdminUser)
  })

  test('loads the list with seeded coupons', async () => {
    await page.goto('http://localhost:3000/admin/collections/coupons')
    await expect(page.locator('table.pmc-table')).toBeVisible()
    await expect(page.getByText(/\d+ results?/)).toBeVisible()
  })

  test('search filters and resets to page 1, updating the URL', async () => {
    await page.goto('http://localhost:3000/admin/collections/coupons')
    await page.fill('input[placeholder="Search by code…"]', 'E2E-COUPON-01')
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/dtSearch=E2E-COUPON-01/)
    const rows = page.locator('table.pmc-table tbody tr')
    await expect(rows).toHaveCount(1)
    await page.fill('input[placeholder="Search by code…"]', '')
    await page.waitForTimeout(500)
  })

  test('sorting by value updates order and URL sort param', async () => {
    await page.goto('http://localhost:3000/admin/collections/coupons')
    // Numeric columns default to descending-first under TanStack's sortDescFirst heuristic.
    await page.getByRole('button', { name: 'Value' }).click()
    await expect(page).toHaveURL(/dtSort=-value/)
    await page.getByRole('button', { name: 'Value' }).click()
    await expect(page).toHaveURL(/dtSort=value/)
  })

  test('pagination Next/Prev updates the page param', async () => {
    await page.goto('http://localhost:3000/admin/collections/coupons')
    const nextBtn = page.getByRole('button', { name: 'Next', exact: true })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
    await expect(page).toHaveURL(/dtPage=2/)
    await page.getByRole('button', { name: 'Prev', exact: true }).click()
    await expect(page).not.toHaveURL(/dtPage=2/)
  })

  test('deep link into page 2 sorted by -createdAt loads that state directly', async () => {
    await page.goto('http://localhost:3000/admin/collections/coupons?dtPage=2&dtSort=-createdAt')
    await expect(page.locator('table.pmc-table')).toBeVisible()
    await expect(page.getByText('Page 2 of')).toBeVisible()
  })

  test('bulk select and delete removes rows', async () => {
    await page.goto('http://localhost:3000/admin/collections/coupons?dtSearch=E2E-COUPON-0')
    await page.waitForTimeout(500)
    const checkboxes = page.locator('table.pmc-table tbody input[type="checkbox"]')
    const countBefore = await checkboxes.count()
    expect(countBefore).toBeGreaterThan(0)
    await checkboxes.first().check()

    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: /Delete/ }).click()
    await expect(page.getByText('1 selected')).not.toBeVisible({ timeout: 10000 })

    const checkboxesAfter = page.locator('table.pmc-table tbody input[type="checkbox"]')
    await expect(checkboxesAfter).toHaveCount(countBefore - 1)
  })
})
