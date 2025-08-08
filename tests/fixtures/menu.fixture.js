import { test as base } from '@playwright/test';

// Extend the base test to include menu setup
export const test = base.extend({
  // This fixture sets up a week menu with at least one recipe
  weekMenuWithRecipes: async ({ page }, use) => {
    // Navigate to menu selector
    await page.goto('/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');
    
    // Wait for recipes to load
    await page.waitForSelector('button:has-text("Select for menu")', { timeout: 10000 });
    
    // Select first 3 recipes for a more realistic menu
    const selectButtons = await page.locator('button:has-text("Select for menu")').all();
    const recipesToSelect = Math.min(3, selectButtons.length);
    
    for (let i = 0; i < recipesToSelect; i++) {
      await selectButtons[i].click();
      await page.waitForTimeout(500); // Small delay between selections
    }
    
    // Wait for selections to be saved
    await page.waitForTimeout(1000);
    
    // Provide the page to the test
    await use(page);
  },
  
  // This fixture ensures shopping lists are loaded
  shoppingListsLoaded: async ({ page }, use) => {
    // Navigate to home to ensure lists are loaded
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists section
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // Get existing lists data
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    const existingStoreNames = [];
    for (const list of existingLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      existingStoreNames.push(storeName.trim());
    }
    
    // Provide both the page and the existing store names to the test
    await use({ page, existingStoreNames });
  }
});

export { expect } from '@playwright/test';