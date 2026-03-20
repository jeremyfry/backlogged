import { test, expect } from '@playwright/test'
import { loginOrSetup } from './helpers'

/**
 * Add a game to the collection and optionally place it in the backlog.
 */
async function addGame(
  page: import('@playwright/test').Page,
  title: string,
  platform: string,
  backlogPosition?: number,
) {
  await page.goto('/collection')
  await page.getByRole('button', { name: 'Add game' }).click()
  await page.getByText('Add manually without IGDB →').click()
  await page.getByLabel(/Title \*/i).fill(title)
  await page.getByPlaceholder('NES, PS2…').fill(platform)

  if (backlogPosition !== undefined) {
    const posInput = page.getByLabel(/Backlog Position/i)
    await posInput.scrollIntoViewIfNeeded()
    await posInput.fill(String(backlogPosition))
  }

  await page.getByRole('button', { name: 'Add to Collection' }).click()
  await expect(page.getByRole('button', { name: new RegExp(title, 'i') })).toBeVisible({ timeout: 5000 })
}

test.describe('Backlog', () => {
  test.beforeEach(async ({ page }) => {
    await loginOrSetup(page)
  })

  test('shows empty state when no games have a backlog position', async ({ page }) => {
    await page.goto('/backlog')
    await expect(page.getByText('EMPTY')).toBeVisible()
  })

  test('shows backlogged games after assigning positions', async ({ page }) => {
    await addGame(page, 'Halo Combat Evolved', 'Xbox', 1)
    await addGame(page, 'Doom Eternal', 'PC', 2)

    await page.goto('/backlog')

    await expect(page.getByText('Halo Combat Evolved')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Doom Eternal')).toBeVisible()

    // Games not in backlog should not appear
    await addGame(page, 'No Backlog Game', 'Switch') // no position
    await page.goto('/backlog')
    await expect(page.getByText('No Backlog Game')).not.toBeVisible()
  })

  test('navigates to backlog via bottom nav', async ({ page }) => {
    await page.goto('/collection')
    await page.getByRole('link', { name: 'Backlog' }).click()
    await expect(page).toHaveURL(/\/backlog/)
  })

  test('game count is shown in backlog header', async ({ page }) => {
    await addGame(page, 'Resident Evil 4', 'PS4', 1)

    await page.goto('/backlog')
    // e.g. "1 game in queue · drag to reorder"
    await expect(page.getByText(/in queue/)).toBeVisible({ timeout: 5000 })
  })
})
