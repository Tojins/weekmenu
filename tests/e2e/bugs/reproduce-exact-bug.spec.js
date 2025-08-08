import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Reproduce exact bug from screenshot', () => {
  test.use({ 
    timeout: 45000 
  });

  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page);
  });

  test('BUG: Store with existing list appears as available option', async ({ page }) => {
    // Navigate to home
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists section to load
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // Get all existing shopping lists
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    console.log(`Found ${existingLists.length} existing shopping lists`);
    
    // Get store names from existing lists
    const existingStoreNames = [];
    for (const list of existingLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      existingStoreNames.push(storeName.trim());
      console.log(`Existing list for: ${storeName.trim()}`);
    }
    
    // If we have any existing lists, let's test the bug
    if (existingLists.length > 0) {
      // Click New List button
      await page.getByRole('button', { name: 'New List' }).click();
      
      // Wait for modal
      await expect(page.getByText('Create New Shopping List')).toBeVisible();
      await expect(page.getByText('Select a store for your new list:')).toBeVisible();
      
      // Get all available store options in the modal
      const availableStoreButtons = await page.locator('.fixed button').filter({
        has: page.locator('.font-medium')
      }).filter({
        hasNot: page.locator('text=Cancel')
      }).all();
      
      console.log(`Modal shows ${availableStoreButtons.length} available stores`);
      
      // Check each available store
      for (const button of availableStoreButtons) {
        const availableStoreName = await button.locator('.font-medium').textContent();
        console.log(`Available store option: ${availableStoreName.trim()}`);
        
        // Check if this store already has a list
        for (const existingStore of existingStoreNames) {
          // Check if names match (case-insensitive and partial match)
          if (availableStoreName.toLowerCase().includes(existingStore.toLowerCase()) ||
              existingStore.toLowerCase().includes(availableStoreName.toLowerCase())) {
            console.log(`❌ BUG FOUND: "${availableStoreName}" is shown as available but "${existingStore}" already has a list!`);
            
            // Take a screenshot for evidence
            await page.screenshot({ path: 'bug-evidence.png', fullPage: true });
            
            // This should fail to demonstrate the bug
            throw new Error(`BUG CONFIRMED: Store "${availableStoreName}" appears as available despite "${existingStore}" already having a list`);
          }
        }
      }
      
      console.log('No bug found with current data');
    } else {
      console.log('No existing lists to test against');
      
      // Create a list first, then test
      await page.getByRole('button', { name: 'New List' }).click();
      await expect(page.getByText('Create New Shopping List')).toBeVisible();
      
      // Click first available store
      const firstStore = await page.locator('.fixed button').filter({
        has: page.locator('.font-medium')
      }).filter({
        hasNot: page.locator('text=Cancel')
      }).first();
      
      const firstStoreName = await firstStore.locator('.font-medium').textContent();
      console.log(`Creating list for: ${firstStoreName}`);
      
      await firstStore.click();
      
      // Wait for list creation
      await page.waitForTimeout(3000);
      
      // Navigate back to home
      await page.goto('/weekmenu/');
      await page.waitForLoadState('networkidle');
      
      // Now try to create another list - the store we just used should NOT appear
      await page.getByRole('button', { name: 'New List' }).click();
      await expect(page.getByText('Create New Shopping List')).toBeVisible();
      
      // Check if the same store appears again
      const availableAfterCreation = await page.locator('.fixed button').filter({
        has: page.locator('.font-medium')
      }).filter({
        hasNot: page.locator('text=Cancel')
      }).all();
      
      for (const button of availableAfterCreation) {
        const storeName = await button.locator('.font-medium').textContent();
        if (storeName === firstStoreName) {
          console.log(`❌ BUG FOUND: "${storeName}" appears as available after creating a list for it!`);
          throw new Error(`BUG CONFIRMED: Store "${storeName}" appears as available after creating a list`);
        }
      }
    }
  });
  
  test('Debug: Log exact data being used for filtering', async ({ page }) => {
    // Navigate to home
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Inject debugging code to log the exact data
    await page.evaluate(() => {
      // Hook into React Query to log data
      window.__DEBUG_SHOPPING_LISTS__ = [];
      window.__DEBUG_STORES__ = [];
      
      // Log when modal opens
      const originalClick = HTMLElement.prototype.click;
      HTMLElement.prototype.click = function() {
        if (this.textContent?.includes('New List')) {
          console.log('=== New List clicked ===');
          console.log('Shopping Lists:', window.__DEBUG_SHOPPING_LISTS__);
          console.log('Stores:', window.__DEBUG_STORES__);
        }
        return originalClick.apply(this, arguments);
      };
    });
    
    // Wait a bit for data to load
    await page.waitForTimeout(2000);
    
    // Try to capture the data being passed to components
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Click New List to trigger our debug logging
    await page.getByRole('button', { name: 'New List' }).click();
    
    // Log what we captured
    console.log('Console messages:', consoleMessages);
  });
});