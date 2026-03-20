import { test, expect } from '@playwright/test'
import { loginOrSetup } from './helpers'

test.describe('Games — add manually', () => {
  test.beforeEach(async ({ page }) => {
    await loginOrSetup(page)
  })

  test('adds a game manually and shows it in collection', async ({ page }) => {
    // Open AddGame sheet via FAB
    await page.getByRole('button', { name: 'Add game' }).click()

    // Sheet should appear with search step
    await expect(page.getByPlaceholder('Search IGDB…')).toBeVisible()

    // Click "Add manually"
    await page.getByText('Add manually without IGDB →').click()

    // Fill in game form
    await page.getByLabel(/Title \*/i).fill('Super Mario Bros.')
    await page.getByPlaceholder('NES, PS2…').fill('NES')
    // Language defaults to English — leave it

    // Submit
    await page.getByRole('button', { name: 'Add to Collection' }).click()

    // Sheet should close and game should appear in collection
    await expect(page.getByRole('button', { name: /Super Mario Bros\./i })).toBeVisible({ timeout: 5000 })
  })

  test('adds a wishlist game with target price', async ({ page }) => {
    await page.getByRole('button', { name: 'Add game' }).click()
    await page.getByText('Add manually without IGDB →').click()

    // Switch to Wishlist
    await page.getByRole('button', { name: 'wishlist' }).click()

    await page.getByLabel(/Title \*/i).fill('Castlevania SOTN')
    await page.getByPlaceholder('NES, PS2…').fill('PS1')

    // Target price field should be visible (wishlist mode)
    await expect(page.getByPlaceholder('Max you\'d pay')).toBeVisible()
    await page.getByPlaceholder('Max you\'d pay').fill('40')

    await page.getByRole('button', { name: 'Add to Collection' }).click()

    // Sheet closes without error
    await expect(page.getByPlaceholder('Search IGDB…')).not.toBeVisible({ timeout: 5000 })
  })

  test('can close the sheet without saving', async ({ page }) => {
    await page.getByRole('button', { name: 'Add game' }).click()
    await expect(page.getByPlaceholder('Search IGDB…')).toBeVisible()

    await page.getByText('Add manually without IGDB →').click()
    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByPlaceholder('Search IGDB…')).not.toBeVisible()
  })
})

test.describe('Games — detail and delete', () => {
  test.beforeEach(async ({ page }) => {
    await loginOrSetup(page)

    // Add a game to work with
    await page.getByRole('button', { name: 'Add game' }).click()
    await page.getByText('Add manually without IGDB →').click()
    await page.getByLabel(/Title \*/i).fill('Metroid Prime')
    await page.getByPlaceholder('NES, PS2…').fill('GameCube')
    await page.getByRole('button', { name: 'Add to Collection' }).click()

    // Wait for card to appear
    await expect(page.getByRole('button', { name: /Metroid Prime/i })).toBeVisible({ timeout: 5000 })
  })

  test('opens game detail sheet on card click', async ({ page }) => {
    await page.getByRole('button', { name: /Metroid Prime/i }).click()

    // Detail sheet shows title as heading
    await expect(page.locator('h2').filter({ hasText: 'Metroid Prime' })).toBeVisible()
  })

  test('can delete a game with confirmation', async ({ page }) => {
    await page.getByRole('button', { name: /Metroid Prime/i }).click()

    // First click shows confirmation prompt
    await page.getByRole('button', { name: 'Delete' }).click()

    // Confirmation step appears — second Delete confirms
    await expect(page.getByText(/Delete.*Metroid Prime/)).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).last().click()

    // Card should be gone from collection
    await expect(page.getByRole('button', { name: /Metroid Prime/i })).not.toBeVisible({ timeout: 5000 })
  })
})
