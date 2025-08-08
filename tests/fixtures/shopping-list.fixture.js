import { test as base } from '@playwright/test';

// Extend the base test to include shopping list setup
export const test = base.extend({
  // This fixture sets up a known state with existing shopping lists (idempotent)
  existingShoppingLists: async ({ page }, use) => {
    // Navigate to home first
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists section
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // Get current shopping lists
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    const existingStoreNames = new Set();
    for (const list of existingLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      existingStoreNames.add(storeName.trim());
    }
    
    console.log('Current shopping lists:', Array.from(existingStoreNames));
    
    // Create lists for specific stores if they don't exist
    const targetStores = ['Colruyt', 'Delhaize'];
    const createdStores = [];
    
    for (const targetStore of targetStores) {
      // Check if any existing list already belongs to this store chain
      const alreadyExists = Array.from(existingStoreNames).some(existing => 
        existing.toLowerCase().includes(targetStore.toLowerCase())
      );
      
      if (alreadyExists) {
        console.log(`List for ${targetStore} chain already exists, skipping`);
        continue;
      }
      
      // Check if modal is already open and close it
      const modalOpen = await page.locator('text=Create New Shopping List').isVisible();
      if (modalOpen) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      // Click New List
      await page.getByRole('button', { name: 'New List' }).click();
      await page.waitForSelector('text=Create New Shopping List');
      
      // Find a store button that belongs to this chain
      const storeButtons = await page.locator('.fixed button').filter({
        has: page.locator('.font-medium')
      }).filter({
        hasNot: page.locator('text=Cancel')
      }).all();
      
      let storeFound = false;
      for (const button of storeButtons) {
        const storeName = await button.locator('.font-medium').textContent();
        if (storeName.toLowerCase().includes(targetStore.toLowerCase())) {
          console.log(`Creating list for ${storeName}`);
          await button.click();
          await page.waitForTimeout(2000); // Wait for list creation
          existingStoreNames.add(storeName.trim());
          createdStores.push(storeName.trim());
          storeFound = true;
          break;
        }
      }
      
      if (!storeFound) {
        console.log(`No ${targetStore} store available`);
        // Close modal if store doesn't exist
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
    
    // If we created any lists, navigate back to home to ensure we're in the right state
    if (createdStores.length > 0) {
      console.log('Navigating back to home after creating lists');
      await page.goto('/weekmenu/');
      await page.waitForLoadState('networkidle');
    }
    
    // Provide the list of stores that have lists
    await use({ page, existingStoreNames: Array.from(existingStoreNames), createdStores });
  },
  
  // This fixture ensures we have recipes in the menu (idempotent)
  menuWithRecipes: async ({ page }, use) => {
    // Navigate to menu selector
    await page.goto('/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');
    
    // Check how many recipes are already selected
    const selectedCount = await page.locator('.bg-red-500').count();
    console.log(`Found ${selectedCount} recipes already selected`);
    
    const targetRecipeCount = 3;
    
    if (selectedCount < targetRecipeCount) {
      // Select more recipes to have at least 3
      const availableButtons = await page.locator('button:has-text("Select for menu")').all();
      const toSelect = Math.min(targetRecipeCount - selectedCount, availableButtons.length);
      
      console.log(`Selecting ${toSelect} more recipes`);
      for (let i = 0; i < toSelect; i++) {
        await availableButtons[i].click();
        await page.waitForTimeout(500);
      }
      
      // Wait for state to settle
      await page.waitForTimeout(1000);
      console.log(`Total recipes selected: ${targetRecipeCount}`);
    } else {
      console.log(`Already have ${selectedCount} recipes, no need to add more`);
    }
    
    await use({ page, recipeCount: Math.max(targetRecipeCount, selectedCount) });
  },
  
  // Combined fixture that sets up both menu and shopping lists
  fullTestSetup: async ({ page, menuWithRecipes, existingShoppingLists }, use) => {
    const { recipeCount } = menuWithRecipes;
    const { existingStoreNames } = existingShoppingLists;
    
    await use({
      page,
      recipeCount,
      existingStoreNames
    });
  }
});

export { expect } from '@playwright/test';