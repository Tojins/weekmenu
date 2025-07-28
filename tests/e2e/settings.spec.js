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

  test('should navigate back from settings to home', async ({ page }) => {
    await page.goto('/weekmenu/settings')
    
    // Click back to home
    await page.getByText('Back to Home').click()
    
    // Should be on home page - note: the URL might not have trailing slash
    await expect(page).toHaveURL(/\/weekmenu\/?$/)
  })

  test('should display user profile information', async ({ page }) => {
    await page.goto('/weekmenu/settings')
    
    // Should show user email
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  test('should logout when clicking sign out button', async ({ page }) => {
    await page.goto('/weekmenu/settings')
    
    // Click sign out
    await page.getByText('Sign Out').click()
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })
})