import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Verify list filtering is working correctly', () => {
  test.use({ 
    timeout: 30000 
  });

  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page);
  });

  test('stores with existing lists should NOT appear when creating new list', async ({ page }) => {
    // Navigate to home
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists section
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // Get existing shopping lists
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    const existingStoreNames = [];
    for (const list of existingLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      existingStoreNames.push(storeName.trim());
    }
    
    console.log('Existing shopping lists for stores:', existingStoreNames);
    
    // Click New List button
    await page.getByRole('button', { name: 'New List' }).click();
    
    // Wait for modal
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    await expect(page.getByText('Select a store for your new list:')).toBeVisible();
    
    // Get available stores in the modal
    const availableStoreButtons = await page.locator('.fixed button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=Cancel')
    }).all();
    
    const availableStoreNames = [];
    for (const button of availableStoreButtons) {
      const storeName = await button.locator('.font-medium').textContent();
      availableStoreNames.push(storeName.trim());
    }
    
    console.log('Available stores in modal:', availableStoreNames);
    
    // VERIFY: No store that has a list should appear as available
    for (const existingStore of existingStoreNames) {
      const isAvailable = availableStoreNames.some(available => 
        available.toLowerCase() === existingStore.toLowerCase()
      );
      
      if (isAvailable) {
        throw new Error(`BUG: Store "${existingStore}" has a list but is shown as available!`);
      }
    }
    
    // VERIFY: All available stores should NOT have existing lists
    for (const availableStore of availableStoreNames) {
      const hasExistingList = existingStoreNames.some(existing => 
        existing.toLowerCase() === availableStore.toLowerCase()
      );
      
      expect(hasExistingList).toBe(false);
    }
    
    console.log('✅ Filtering is working correctly!');
    console.log(`   - ${existingStoreNames.length} stores have lists and are NOT shown as available`);
    console.log(`   - ${availableStoreNames.length} stores don\'t have lists and ARE shown as available`);
    
    // If no stores are available, we should see the appropriate message
    if (availableStoreButtons.length === 0) {
      await expect(page.getByText('All stores already have active shopping lists.')).toBeVisible();
      console.log('✅ Shows correct message when all stores have lists');
    }
  });
});