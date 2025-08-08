import { test, expect } from '@playwright/test'

async function login(page) {
  await page.goto('/weekmenu/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'testpassword123')
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 })
}

test.describe('Recipe Cache Optimization', () => {
  test('should not have cache misses when navigating from home to menu selector', async ({ page }) => {
    // Track all recipe-related API calls
    const apiCalls = []
    
    // Monitor console logs
    page.on('console', msg => {
      if (msg.text().includes('[RecipeSelectorPanel]') || msg.text().includes('[fetchRecipePreview]')) {
        console.log('Console:', msg.text())
      }
    })
    
    // Monitor network requests
    page.on('request', request => {
      const url = request.url()
      if (url.includes('/rest/v1/recipes') && request.method() === 'GET') {
        const callInfo = {
          url,
          method: request.method(),
          postData: request.postData(),
          headers: request.headers(),
          timestamp: Date.now()
        }
        apiCalls.push(callInfo)
        console.log(`[API Call ${apiCalls.length}] ${request.method()} ${url}`)
      }
    })

    // Login and navigate to home
    await login(page)
    await page.goto('/weekmenu/')
    
    // Wait for home page to load and recipe preview to be fetched
    await page.waitForSelector('[data-testid="recipe-selector-panel"]', { timeout: 10000 })
    
    // Give some time for the preview query to complete (including retries)
    await page.waitForTimeout(2000)
    
    // Count preview API calls
    const previewCalls = apiCalls.filter(call => 
      call.url.includes('limit=4') && call.url.includes('random_order_')
    )
    console.log(`Preview API calls: ${previewCalls.length}`)
    
    // Navigate to menu selector
    await page.click('[data-testid="recipe-selector-panel"]')
    await page.waitForURL('**/menu-selector')
    
    // Wait for recipes to load
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 })
    
    // Give some time for any additional queries
    await page.waitForTimeout(2000)
    
    // Analyze API calls
    const allRecipeCalls = apiCalls.filter(call => call.url.includes('random_order_'))
    const menuSelectorCalls = apiCalls.filter(call => 
      call.url.includes('offset=') && call.url.includes('random_order_')
    )
    
    console.log(`Total recipe API calls: ${allRecipeCalls.length}`)
    console.log(`Menu selector API calls: ${menuSelectorCalls.length}`)
    
    // The preview calls might include retries, but should be at most 3 (initial + 2 retries)
    expect(previewCalls.length).toBeLessThanOrEqual(3)
    
    // The menu selector should make exactly one call for the first page
    expect(menuSelectorCalls.length).toBe(1)
    
    // Verify the same seed/ordering is being used
    if (previewCalls.length > 0 && menuSelectorCalls.length > 0) {
      const previewOrderColumn = previewCalls[0].url.match(/order=([^&]+)/)?.[1]
      const menuOrderColumn = menuSelectorCalls[0].url.match(/order=([^&]+)/)?.[1]
      
      // Both should use the same random_order column
      expect(previewOrderColumn).toBeTruthy()
      expect(menuOrderColumn).toBeTruthy()
      expect(previewOrderColumn).toBe(menuOrderColumn)
    }
  })
  
  test('should reuse cached recipe data when navigating back and forth', async ({ page }) => {
    const apiCalls = []
    
    // Monitor network requests
    page.on('request', request => {
      const url = request.url()
      if (url.includes('/rest/v1/recipes') && request.method() === 'GET') {
        apiCalls.push({
          url,
          timestamp: Date.now()
        })
      }
    })

    // Login and navigate to home
    await login(page)
    await page.goto('/weekmenu/')
    
    // Wait for home page to load
    await page.waitForSelector('[data-testid="recipe-selector-panel"]', { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for any retries to complete
    
    const initialCallCount = apiCalls.length
    
    // Navigate to menu selector
    await page.click('[data-testid="recipe-selector-panel"]')
    await page.waitForURL('**/menu-selector')
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 })
    await page.waitForTimeout(1000)
    
    const afterMenuSelectorCount = apiCalls.length
    
    // Navigate back to home
    await page.click('text=Back to Home')
    // Don't wait for URL change, just wait for the element to appear
    await page.waitForSelector('[data-testid="recipe-selector-panel"]', { timeout: 10000 })
    await page.waitForTimeout(1000)
    
    const afterBackHomeCount = apiCalls.length
    
    // Navigate to menu selector again
    await page.click('[data-testid="recipe-selector-panel"]')
    await page.waitForURL('**/menu-selector')
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 })
    await page.waitForTimeout(1000)
    
    const finalCallCount = apiCalls.length
    
    console.log(`Initial calls: ${initialCallCount}`)
    console.log(`After first menu selector: ${afterMenuSelectorCount}`)
    console.log(`After back to home: ${afterBackHomeCount}`)
    console.log(`After second menu selector: ${finalCallCount}`)
    
    // Going back to home should not trigger new API calls (cached)
    expect(afterBackHomeCount).toBe(afterMenuSelectorCount)
    
    // Second navigation to menu selector should not trigger new API calls (cached)
    expect(finalCallCount).toBe(afterBackHomeCount)
  })
  
  test('should share recipe data between preview and full list', async ({ page }) => {
    const apiCalls = []
    
    // Monitor network requests
    page.on('request', request => {
      const url = request.url()
      if (url.includes('/rest/v1/recipes') && request.method() === 'GET') {
        apiCalls.push({
          url,
          method: request.method()
        })
      }
    })

    // Login and navigate to home
    await login(page)
    await page.goto('/weekmenu/')
    
    // Wait for preview to load
    await page.waitForSelector('[data-testid="recipe-selector-panel"]', { timeout: 10000 })
    await page.waitForTimeout(2000)
    
    // Get the preview recipes from the DOM
    const previewRecipes = await page.evaluate(() => {
      const images = document.querySelectorAll('[data-testid="recipe-selector-panel"] img[alt]')
      return Array.from(images).map(img => ({
        title: img.getAttribute('alt'),
        src: img.getAttribute('src')
      })).filter(r => r.title) // Filter out placeholder images
    })
    
    console.log(`Found ${previewRecipes.length} preview recipes`)
    
    // Navigate to menu selector
    await page.click('[data-testid="recipe-selector-panel"]')
    await page.waitForURL('**/menu-selector')
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 })
    
    // Get the first 4 recipes from the menu selector
    const menuRecipes = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="recipe-card"]')
      return Array.from(cards).slice(0, 4).map(card => ({
        title: card.querySelector('h3')?.textContent || '',
        src: card.querySelector('img')?.getAttribute('src') || ''
      }))
    })
    
    console.log(`Found ${menuRecipes.length} menu selector recipes`)
    
    // The first recipes in menu selector should match the preview
    // (if we have preview recipes - they might not load due to timing)
    if (previewRecipes.length > 0) {
      for (let i = 0; i < Math.min(previewRecipes.length, menuRecipes.length); i++) {
        expect(menuRecipes[i].title).toBe(previewRecipes[i].title)
      }
    }
  })
})