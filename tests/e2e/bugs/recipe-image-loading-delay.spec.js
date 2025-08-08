import { test, expect } from '@playwright/test'
import { loginWithStorageState } from '../../helpers/auth-persistent'

test.describe('Recipe Image Loading Performance Bug', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page)
  })

  test('recipe images should load before auth timeout', async ({ page }) => {
    // Start measuring time
    const startTime = Date.now()
    
    // Navigate to home page
    await page.goto('/weekmenu/')
    
    // Wait for the Recipe Selector panel to be visible
    await page.getByRole('button', { name: /Recipe Selector/ }).waitFor({ state: 'visible' })
    
    // Click on Recipe Selector to navigate to menu selector
    await page.getByRole('button', { name: /Recipe Selector/ }).click()
    
    // Wait for navigation to menu selector
    await page.waitForURL('**/menu-selector')
    
    // Track when first recipe image becomes visible
    const recipeImagePromise = page.locator('.recipe-card img').first().waitFor({ 
      state: 'visible',
      timeout: 10000 
    })
    
    // Also track console errors for timeouts
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('timeout')) {
        consoleErrors.push({
          text: msg.text(),
          time: Date.now() - startTime
        })
      }
    })
    
    // Wait for recipe image with timeout tracking
    let imageLoadTime = null
    try {
      await recipeImagePromise
      imageLoadTime = Date.now() - startTime
      console.log(`Recipe image loaded after ${imageLoadTime}ms`)
    } catch (error) {
      const failTime = Date.now() - startTime
      console.log(`Recipe image failed to load after ${failTime}ms`)
      console.log('Console errors:', consoleErrors)
      throw new Error(`Recipe images did not load within timeout. Auth errors: ${consoleErrors.map(e => e.text).join(', ')}`)
    }
    
    // Recipe images should load quickly, not after auth timeout
    expect(imageLoadTime).toBeLessThan(3000) // Should load before the 3s auth timeout
    
    // Verify multiple recipe images are visible
    const visibleRecipeImages = await page.locator('.recipe-card img').count()
    expect(visibleRecipeImages).toBeGreaterThan(0)
    
    // Check that we didn't hit auth timeouts before images loaded
    const authTimeouts = consoleErrors.filter(e => e.time < imageLoadTime)
    if (authTimeouts.length > 0) {
      throw new Error(`Auth timeouts occurred before recipe images loaded: ${authTimeouts.map(e => `${e.text} at ${e.time}ms`).join(', ')}`)
    }
  })

  test('recipe preview images on home page should load before auth timeout', async ({ page }) => {
    const startTime = Date.now()
    
    // Navigate to home page
    await page.goto('/weekmenu/')
    
    // Track all console logs
    const consoleErrors = []
    const consoleLogs = []
    page.on('console', msg => {
      const logEntry = {
        text: msg.text(),
        time: Date.now() - startTime,
        type: msg.type()
      }
      
      if (msg.type() === 'error' && msg.text().includes('timeout')) {
        consoleErrors.push(logEntry)
      }
      
      // Capture relevant logs for debugging
      if (msg.text().includes('RecipeSelector') || 
          msg.text().includes('WeekMenu') || 
          msg.text().includes('fetchRecipe') ||
          msg.text().includes('AuthProvider')) {
        consoleLogs.push(logEntry)
      }
    })
    
    // Wait for Recipe Selector panel
    await page.getByRole('button', { name: /Recipe Selector/ }).waitFor({ state: 'visible' })
    
    // Check for recipe preview images in the Recipe Selector panel
    // The RecipeSelectorPanel renders images inside a button with specific structure
    const previewImageSelector = 'button img[alt]'
    
    // Wait for preview images
    let imageLoadTime = null
    try {
      await page.locator(previewImageSelector).first().waitFor({ 
        state: 'visible',
        timeout: 5000 
      })
      imageLoadTime = Date.now() - startTime
      console.log(`Recipe preview images loaded after ${imageLoadTime}ms`)
    } catch (error) {
      const failTime = Date.now() - startTime
      console.log(`Recipe preview images failed to load after ${failTime}ms`)
      console.log('Console errors:', consoleErrors)
      
      // Debug logs
      console.log('\n=== Timeline ===')
      consoleLogs.forEach(log => {
        console.log(`[${log.time}ms] ${log.type}: ${log.text}`)
      })
      
      // Debug: log what we can see
      const visibleElements = await page.locator('button').allTextContents()
      console.log('\nVisible button texts:', visibleElements)
      
      throw new Error(`Recipe preview images did not load within timeout`)
    }
    
    // Preview images should load before auth timeout
    expect(imageLoadTime).toBeLessThan(3000)
  })
})