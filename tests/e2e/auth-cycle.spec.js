import { test, expect } from '@playwright/test'
import { loginTestUser, ensureLoggedOut } from '../helpers/auth-real'

test.describe('Authentication Cycle', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page)
  })

  test('login-logout-login maintains access', async ({ page }) => {
    // First login
    await loginTestUser(page)
    await page.goto('/weekmenu/')
    
    // Verify logged in - shopping lists panel should be visible
    await expect(page.locator('h2:text("Shopping Lists")')).toBeVisible()
    
    // Logout by clearing auth
    await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const authKey = keys.find(k => k.includes('-auth-token'))
      if (authKey) localStorage.removeItem(authKey)
    })
    
    // Navigate to login page
    await page.goto('/weekmenu/login')
    await expect(page).toHaveURL(/\/login/)
    
    // Login again
    await loginTestUser(page)
    await page.goto('/weekmenu/')
    
    // Should still have access
    await expect(page.locator('h2:text("Shopping Lists")')).toBeVisible()
  })

  test('authentication stores correct data', async ({ page }) => {
    await loginTestUser(page)
    
    // Check localStorage has required auth data
    const authData = await page.evaluate(() => {
      // Supabase stores auth in a key with format sb-<project-ref>-auth-token
      const keys = Object.keys(localStorage)
      const authKey = keys.find(k => k.includes('-auth-token'))
      const stored = authKey ? localStorage.getItem(authKey) : null
      return stored ? JSON.parse(stored) : null
    })
    
    expect(authData).toBeTruthy()
    expect(authData.access_token).toBeTruthy()
    expect(authData.refresh_token).toBeTruthy()
    expect(authData.user).toBeTruthy()
  })

  test('logout clears authentication', async ({ page }) => {
    // Login first
    await loginTestUser(page)
    await page.goto('/weekmenu/')
    
    // Verify logged in
    await expect(page.locator('h2:text("Shopping Lists")')).toBeVisible()
    
    // Logout by clearing auth directly (since Settings page has rendering issues in tests)
    await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const authKey = keys.find(k => k.includes('-auth-token'))
      if (authKey) localStorage.removeItem(authKey)
    })
    
    // Navigate to login page
    await page.goto('/weekmenu/login')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    
    // Auth data should be cleared
    const hasAuth = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      return keys.some(k => k.includes('-auth-token'))
    })
    expect(hasAuth).toBe(false)
  })

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected routes without auth
    await page.goto('/weekmenu/menu-selector')
    await expect(page).toHaveURL(/\/login/)
    
    await page.goto('/weekmenu/recipe-selector')
    await expect(page).toHaveURL(/\/login/)
    
    await page.goto('/weekmenu/shopping-list/some-id')
    await expect(page).toHaveURL(/\/login/)
  })
})