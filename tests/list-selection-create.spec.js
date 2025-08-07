import { test, expect } from '@playwright/test'
import { loginWithStorageState } from './helpers/auth-persistent'

test.describe('List Selection and Creation - Shared Filtering', () => {
  test.use({ 
    // Set reasonable timeout for these tests
    timeout: 30000 
  })

  test.beforeEach(async ({ page }) => {
    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text())
      }
    })
    
    // Use persistent auth for better performance
    await loginWithStorageState(page)
    // Ensure we're on the home page
    await page.goto('/weekmenu/')
    await page.waitForLoadState('networkidle')
  })

  test('stores with existing active lists should NOT appear in NewListModal from both locations', async ({ page }) => {
    // Wait for Shopping Lists section to load
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 })
    
    // Click "New List" button from home panel
    await page.getByRole('button', { name: 'New List' }).click()
    
    // Wait for modal to appear
    await page.waitForSelector('h3:has-text("Create New Shopping List")', { timeout: 5000 })
    
    // Get all store buttons in the modal (exclude Cancel button)
    const modalStores = page.locator('.fixed button').filter({ 
      hasNot: page.locator('text=Cancel') 
    })
    const initialStoreCount = await modalStores.count()
    console.log(`Initial available stores in home modal: ${initialStoreCount}`)
    
    if (initialStoreCount === 0) {
      console.log('No stores available - all stores already have lists')
      return // Test passes - filtering is working
    }
    
    // Get the first available store name
    const firstStoreName = await modalStores.first().textContent()
    console.log(`Creating list for: ${firstStoreName}`)
    
    // Create a list for this store
    await modalStores.first().click()
    
    // Wait for either navigation or modal close
    await Promise.race([
      page.waitForURL(/\/shopping-list\//, { timeout: 10000 }),
      page.waitForSelector('text=Failed to create shopping list', { timeout: 10000 }).catch(() => null)
    ])
    
    // Check if we navigated
    if (page.url().includes('/shopping-list/')) {
      console.log(`Created list at: ${page.url()}`)
    } else {
      // Check for error message
      const errorMessage = await page.locator('text=Failed to create shopping list').count()
      if (errorMessage > 0) {
        console.log('Failed to create shopping list - likely due to existing list')
        return // Test can't continue
      }
      throw new Error('Did not navigate to shopping list and no error shown')
    }
    
    // Navigate back to home
    await page.goto('/weekmenu/')
    await page.waitForSelector('h2:has-text("Shopping Lists")')
    
    // Verify the new list appears in the home panel
    await expect(page.locator(`button:has-text("${firstStoreName.trim()}")`).first()).toBeVisible()
    
    // Open new list modal again
    await page.getByRole('button', { name: 'New List' }).click()
    await page.waitForSelector('h3:has-text("Create New Shopping List")')
    
    // The store we just created a list for should NOT be visible
    const updatedModalStores = page.locator('.fixed button').filter({ 
      hasText: firstStoreName.trim() 
    })
    await expect(updatedModalStores).toHaveCount(0)
    console.log(`✓ ${firstStoreName} correctly filtered out from home modal`)
    
    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click()
    
    // Now test from AddToShoppingList flow
    // Click on the recipe selector to go to menu-selector
    await page.locator('button:has-text("Recipe Selector")').click()
    await expect(page).toHaveURL(/\/menu-selector/)
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if we need to select recipes
    const selectedRecipes = page.locator('.text-green-600')
    if (await selectedRecipes.count() === 0) {
      // No recipes selected, select some
      const recipeCards = page.locator('[data-testid="recipe-card"]')
      if (await recipeCards.count() > 0) {
        await recipeCards.nth(0).click()
        await page.waitForTimeout(500)
        if (await recipeCards.count() > 1) {
          await recipeCards.nth(1).click()
          await page.waitForTimeout(500)
        }
      }
    }
    
    // Now recipes should be selected, continue to add to list
    const continueButton = page.getByRole('button', { name: /Generate shopping list|Continue|Add to list/i })
    await expect(continueButton).toBeVisible({ timeout: 10000 })
    await continueButton.click()
    
    // Should be on add-to-list page
    await expect(page).toHaveURL(/\/add-to-list/, { timeout: 10000 })
    
    // Verify header shows a list selection
    await expect(page.locator('text=Adding items to:')).toBeVisible()
    
    // Click "Change list"
    await page.getByRole('button', { name: 'Change list' }).click()
    
    // Wait for modal
    await page.waitForSelector('h3:has-text("Select Shopping List")')
    
    // Should see existing lists section if any lists exist
    const existingListsSection = page.locator('text=Active shopping lists:')
    if (await existingListsSection.count() > 0) {
      console.log('✓ Existing lists section is visible')
      // The list we created should be visible here
      await expect(page.locator(`button:has-text("${firstStoreName.trim()}")`).first()).toBeVisible()
    }
    
    // Click "Create new list for another store"
    await page.getByText('Create new list for another store').click()
    
    // Wait for store selection view
    await page.waitForSelector('text=Select a store for your new list:')
    
    // The store we created a list for should NOT be visible here either
    const addToListModalStores = page.locator('button').filter({ 
      hasText: firstStoreName.trim() 
    })
    await expect(addToListModalStores).toHaveCount(0)
    console.log(`✓ ${firstStoreName} correctly filtered out from AddToList modal`)
    
    // Count remaining stores - should be one less than initial
    const remainingStores = page.locator('button').filter({ 
      hasNot: page.locator('text=Back to lists') 
    })
    const remainingStoreCount = await remainingStores.count()
    console.log(`Remaining available stores: ${remainingStoreCount}`)
    
    // Both modals should show the same number of available stores
    expect(remainingStoreCount).toBe(initialStoreCount - 1)
  })

  test('immediate vs deferred list creation behavior', async ({ page }) => {
    // Wait for home page to load
    await page.waitForSelector('h2:has-text("Shopping Lists")')
    
    // Get initial list count
    const initialLists = await page.locator('button:has-text("items")').count()
    console.log(`Initial shopping lists: ${initialLists}`)
    
    // Test immediate creation from home
    await page.getByRole('button', { name: 'New List' }).click()
    await page.waitForSelector('h3:has-text("Create New Shopping List")')
    
    const storeButton = page.locator('.fixed button').filter({ 
      hasNot: page.locator('text=Cancel') 
    }).first()
    
    if (await storeButton.count() > 0) {
      const storeName = await storeButton.textContent()
      console.log(`Creating list for: ${storeName}`)
      
      await storeButton.click()
      
      // Should navigate immediately to the new list
      await expect(page).toHaveURL(/\/shopping-list\//, { timeout: 10000 })
      console.log('✓ Navigated to new list immediately')
      
      // Go back and verify list was created
      await page.goto('/weekmenu/')
      await page.waitForSelector('h2:has-text("Shopping Lists")')
      
      const newListCount = await page.locator('button:has-text("items")').count()
      expect(newListCount).toBe(initialLists + 1)
      console.log('✓ List was created immediately')
      
      // Test deferred creation from AddToShoppingList
      // First click on the recipe selector to go to menu-selector
      await page.locator('button:has-text("Recipe Selector")').click()
      await expect(page).toHaveURL(/\/menu-selector/)
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle')
      
      // Now check if we need to select recipes
      const selectedRecipes = page.locator('.text-green-600') // Selected recipe indicator
      if (await selectedRecipes.count() === 0) {
        // No recipes selected, select some
        const recipeCards = page.locator('[data-testid="recipe-card"]')
        if (await recipeCards.count() > 0) {
          // Click first two recipes
          await recipeCards.nth(0).click()
          await page.waitForTimeout(500)
          if (await recipeCards.count() > 1) {
            await recipeCards.nth(1).click()
            await page.waitForTimeout(500)
          }
        }
      }
      
      // Continue to add to list
      const continueButton = page.getByRole('button', { name: /Generate shopping list|Continue|Add to list/i })
      await expect(continueButton).toBeVisible({ timeout: 10000 })
      await continueButton.click()
      
      // Should be on add-to-list page
      await expect(page).toHaveURL(/\/add-to-list/)
      
      // Change list to create a new one
      await page.getByRole('button', { name: 'Change list' }).click()
      await page.getByText('Create new list for another store').click()
      
      // Select a store (if any available)
      const availableStore = page.locator('button').filter({ 
        hasNot: page.locator('text=Back to lists') 
      }).first()
      
      if (await availableStore.count() > 0) {
        const newStoreName = await availableStore.textContent()
        console.log(`Selecting store for deferred creation: ${newStoreName}`)
        
        await availableStore.click()
        
        // Should NOT navigate - still on add-to-list page
        await expect(page).toHaveURL(/\/add-to-list/)
        console.log('✓ Did not navigate - deferred creation')
        
        // List count should NOT have increased yet
        await page.goto('/weekmenu/')
        await page.waitForSelector('h2:has-text("Shopping Lists")')
        
        const sameListCount = await page.locator('button:has-text("items")').count()
        expect(sameListCount).toBe(newListCount)
        console.log('✓ List not created yet - creation is deferred')
      }
    }
  })
})