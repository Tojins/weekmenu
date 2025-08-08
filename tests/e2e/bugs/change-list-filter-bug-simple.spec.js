import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Change List - Filter existing lists bug (simplified)', () => {
  test.use({ 
    timeout: 45000 
  });

  test.beforeEach(async ({ page }) => {
    // Use persistent auth
    await loginWithStorageState(page);
    
    // Set up menu with recipes first
    await page.goto('/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');
    
    // Select first available recipe
    const selectButton = page.locator('button:has-text("Select for menu")').first();
    await selectButton.waitFor({ timeout: 10000 });
    await selectButton.click();
    await page.waitForTimeout(1000);
  });

  test('change list modal should filter out stores with existing lists', async ({ page }) => {
    // Go to add-to-list page
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load
    await expect(page.getByText('Add to Shopping List')).toBeVisible({ timeout: 10000 });
    
    // Click Change List button
    await page.getByRole('button', { name: /change list/i }).click();
    
    // Wait for modal
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Get existing lists in the modal
    const existingListButtons = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Create new list|Cancel/')
    }).all();
    
    console.log(`Found ${existingListButtons.length} existing lists`);
    
    // Get store names from existing lists
    const existingStoreNames = [];
    for (const button of existingListButtons) {
      const storeName = await button.locator('.font-medium').textContent();
      existingStoreNames.push(storeName.trim());
    }
    
    console.log('Stores with existing lists:', existingStoreNames);
    
    // Click "Create new list for another store"
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    // Should see store selection
    await expect(page.getByText('Select a store for your new list:')).toBeVisible();
    
    // Get available stores
    const availableStoreButtons = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();
    
    console.log(`Found ${availableStoreButtons.length} available stores`);
    
    // Check each available store
    for (const button of availableStoreButtons) {
      const storeName = await button.locator('.font-medium').textContent();
      const storeNameTrimmed = storeName.trim();
      
      // This store should NOT be in the existing lists
      if (existingStoreNames.includes(storeNameTrimmed)) {
        throw new Error(`BUG FOUND: Store "${storeNameTrimmed}" already has a list but is shown as available!`);
      }
    }
    
    console.log('✓ All available stores are correctly filtered (no existing lists)');
  });
});