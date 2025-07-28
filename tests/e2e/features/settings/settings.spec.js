import { test, expect } from '@playwright/test'
import { loginTestUser } from '../helpers/auth-real'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page)
  })

  test('should navigate from home page to settings', async ({ page }) => {
    await page.goto('/weekmenu/')
    
    // Wait for page to fully load
    await page.waitForSelector('text=Settings')
    
    // Click on settings panel
    await page.getByText('SettingsManage your profile').click()
    
    // Should be on settings page
    await expect(page).toHaveURL(/\/weekmenu\/settings/)
  })

  test('should be able to navigate to settings page', async ({ page }) => {
    await page.goto('/weekmenu/settings')
    
    // Should stay on settings page (not redirect)
    await expect(page).toHaveURL(/\/weekmenu\/settings/)
  })
})