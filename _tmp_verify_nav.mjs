import { chromium } from '@playwright/test'

const OUT = '/private/tmp/claude-501/-Volumes-Work-makeships-app-app-picmychip/fff26a48-f347-4c2c-93d1-f8145e8cb786/scratchpad'
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1300 } })
const page = await context.newPage()

const errors = []
page.on('pageerror', (err) => errors.push(err.message))
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('POSTHOG')) errors.push(msg.text())
})

await page.goto('http://localhost:3000/admin/login', { waitUntil: 'load', timeout: 30000 })
await page.locator('input[type="email"]').first().fill('_tmp_admin_verify@local.test')
await page.locator('input[type="password"]').first().fill('TempAdminVerify123!')
await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/users/login')),
  page.getByRole('button', { name: /login/i }).click(),
])
await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 })

await page.goto('http://localhost:3000/admin/collections/products', { waitUntil: 'load', timeout: 30000 })
await page.waitForTimeout(1000)

await page.locator('#nav-toggler button, button#nav-toggler').first().click().catch(async () => {
  await page.locator('button[aria-label="Open Menu"]').first().click({ force: true })
})
await page.waitForTimeout(700)
await page.screenshot({ path: `${OUT}/nav-icons-groups.png`, fullPage: true })

console.log('errors:', JSON.stringify(errors, null, 2))
await browser.close()
