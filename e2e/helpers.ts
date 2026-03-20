import { type Page } from '@playwright/test'

const TEST_USER = 'admin'
const TEST_PASS = 'securepass123'

/**
 * Ensure the app is configured (create account if needed) and log in.
 * Returns after landing on /collection.
 */
export async function loginOrSetup(page: Page): Promise<void> {
  await page.goto('/login')

  const confirmInput = page.getByPlaceholder('Confirm password')
  const isSetup = await confirmInput.isVisible({ timeout: 5000 }).catch(() => false)

  if (isSetup) {
    await page.getByPlaceholder('Username').fill(TEST_USER)
    await page.getByPlaceholder('Password', { exact: true }).fill(TEST_PASS)
    await confirmInput.fill(TEST_PASS)
    await page.getByRole('button', { name: 'Create Account' }).click()
  } else {
    await page.getByPlaceholder('Username').fill(TEST_USER)
    await page.getByPlaceholder('Password', { exact: true }).fill(TEST_PASS)
    await page.getByRole('button', { name: 'Sign In' }).click()
  }

  await page.waitForURL(/\/collection/, { timeout: 10000 })
}
