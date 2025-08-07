import { test, expect } from '@playwright/test'
import { loginTestUser, ensureLoggedOut } from './helpers/auth-real'

test.describe('Shared Store Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page)
    await loginTestUser(page, 1)
    await page.waitForLoadState('networkidle')
  })

  test('NewListModal filters out stores with active lists', async ({ page }) => {
    // Navigate to home
    await page.goto('/weekmenu/')
    await page.waitForSelector('text=Shopping Lists', { timeout: 10000 })
    
    // First, create a list from home panel
    await page.getByRole('button', { name: 'New List' }).click()
    
    // Count available stores in the modal
    await page.waitForSelector('.fixed', { timeout: 5000 })
    const modalStores = page.locator('.fixed button').filter({ hasText: /Colruyt|Delhaize|Carrefour|Albert Heijn|Aldi|Lidl/ })
    const initialStoreCount = await modalStores.count()
    
    console.log(`Initial available stores: ${initialStoreCount}`)
    
    if (initialStoreCount > 0) {
      // Get first store name and create a list
      const firstStore = modalStores.first()
      const storeName = await firstStore.textContent()
      console.log(`Creating list for: ${storeName}`)
      
      await firstStore.click()
      
      // Wait for navigation or modal close
      await page.waitForTimeout(2000)
      
      // Go back to home if we navigated
      if (!page.url().includes('/weekmenu')) {
        await page.goto('/weekmenu/')
        await page.waitForSelector('text=Shopping Lists')
      }
      
      // Open modal again from home
      await page.getByRole('button', { name: 'New List' }).click()
      await page.waitForSelector('.fixed')
      
      // Count stores again - should be one less
      const updatedStoreCount = await page.locator('.fixed button').filter({ hasText: /Colruyt|Delhaize|Carrefour|Albert Heijn|Aldi|Lidl/ }).count()
      console.log(`Updated available stores: ${updatedStoreCount}`)
      
      // The store we created a list for should not be available
      expect(updatedStoreCount).toBe(initialStoreCount - 1)
      
      // Cancel modal
      await page.getByRole('button', { name: 'Cancel' }).click()
      
      // Now test from AddToShoppingList flow
      // Navigate to menu selector
      await page.goto('/weekmenu/menu-selector')
      
      // Wait for recipes or continue if empty
      try {
        await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 5000 })
        await page.locator('[data-testid="recipe-card"]').first().click()
      } catch {
        // If no recipes, select random recipes
        await page.getByRole('button', { name: /Select Random Recipes|Selecteer willekeurige recepten/i }).click()
      }
      
      // Continue to add to list
      await page.getByRole('button', { name: /Continue|Add to list|Verder/i }).click()
      
      // Should be on add-to-list page
      await expect(page).toHaveURL(/\/add-to-list/, { timeout: 10000 })
      
      // Open change list modal
      await page.getByRole('button', { name: 'Change list' }).click()
      
      // Click create new list option
      await page.getByText('Create new list for another store').click()
      
      // Count available stores in this modal - should be same as home panel
      const addToListStoreCount = await page.locator('button').filter({ hasText: /Colruyt|Delhaize|Carrefour|Albert Heijn|Aldi|Lidl/ }).count()
      console.log(`AddToList available stores: ${addToListStoreCount}`)
      
      // Both places should show the same available stores
      expect(addToListStoreCount).toBe(updatedStoreCount)
    }
  })
})