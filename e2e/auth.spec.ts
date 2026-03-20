import { test, expect } from '@playwright/test'

test.describe('Auth — first-run setup', () => {
  test('shows setup form on first visit', async ({ page }) => {
    await page.goto('/')
    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/)
    // Setup mode banner
    await expect(page.getByText('First-time setup')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm password')).toBeVisible()
  })

  test('creates account and lands on collection', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Username').fill('admin')
    await page.getByPlaceholder('Password', { exact: true }).fill('securepass123')
    await page.getByPlaceholder('Confirm password').fill('securepass123')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page).toHaveURL(/\/collection/)
  })

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Username').fill('admin')
    await page.getByPlaceholder('Password', { exact: true }).fill('securepass123')
    await page.getByPlaceholder('Confirm password').fill('different123')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('shows error when password is too short', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Username').fill('admin')
    await page.getByPlaceholder('Password', { exact: true }).fill('short')
    await page.getByPlaceholder('Confirm password').fill('short')
    await page.getByRole('button', { name: 'Create Account' }).click()

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })
})

test.describe('Auth — login', () => {
  // These tests run after setup is done — the account created above persists
  // across tests in this file (sequential, workers: 1, same server instance).
  // We run setup first, then login tests.

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/login')
    // If already configured (login mode), skip setup
    const confirmInput = page.getByPlaceholder('Confirm password')
    if (await confirmInput.isVisible()) {
      await page.getByPlaceholder('Username').fill('admin')
      await page.getByPlaceholder('Password', { exact: true }).fill('securepass123')
      await confirmInput.fill('securepass123')
      await page.getByRole('button', { name: 'Create Account' }).click()
      await page.waitForURL(/\/collection/)
    }
    await page.close()
  })

  test('shows login form when already configured', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('First-time setup')).not.toBeVisible()
    await expect(page.getByPlaceholder('Confirm password')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('logs in with correct credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Username').fill('admin')
    await page.getByPlaceholder('Password', { exact: true }).fill('securepass123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/collection/)
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Username').fill('admin')
    await page.getByPlaceholder('Password', { exact: true }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText(/unauthorized|invalid/i)).toBeVisible()
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/collection')
    await expect(page).toHaveURL(/\/login/)
  })
})
