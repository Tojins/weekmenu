import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Change List - Direct navigation test', () => {
  test.use({ 
    timeout: 30000 
  });

  test('verify list filtering bug exists', async ({ page }) => {
    // Use persistent auth
    await loginWithStorageState(page);
    
    // Go directly to home to see existing lists
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Get existing shopping lists
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    const existingListElements = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    const existingStoreNames = new Set();
    for (const element of existingListElements) {
      const storeName = await element.locator('.font-medium').first().textContent();
      existingStoreNames.add(storeName.trim());
    }
    
    console.log('Existing lists found for stores:', Array.from(existingStoreNames));
    
    // Click New List button on home page
    await page.getByRole('button', { name: 'New List' }).click();
    
    // Wait for Create New Shopping List modal
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
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
    
    console.log('Available stores in New List modal:', availableStoreNames);
    
    // Check if any existing store is shown as available (this is the bug)
    const buggyStores = availableStoreNames.filter(store => existingStoreNames.has(store));
    
    if (buggyStores.length > 0) {
      console.log('❌ BUG CONFIRMED: These stores already have lists but are shown as available:', buggyStores);
      
      // Let's also test from add-to-list page to confirm it's the same issue
      await page.keyboard.press('Escape'); // Close modal
      
      // We need at least one recipe to access add-to-list
      // Check if there are recipes selected
      const recipeCount = await page.locator('.grid img').count();
      if (recipeCount === 0) {
        console.log('No recipes in menu, adding one...');
        await page.goto('/weekmenu/menu-selector');
        await page.waitForLoadState('networkidle');
        
        // Wait and click first recipe
        const firstRecipe = page.locator('.relative').filter({ has: page.locator('img') }).first();
        await firstRecipe.hover();
        await page.getByRole('button', { name: 'Select for menu' }).first().click();
        await page.waitForTimeout(1000);
      }
      
      // Now go to add-to-list
      await page.goto('/weekmenu/add-to-list');
      await page.waitForLoadState('networkidle');
      
      // Wait for page to load
      await expect(page.getByText('Add to Shopping List')).toBeVisible({ timeout: 10000 });
      
      // Click Change List
      await page.getByRole('button', { name: /change list/i }).click();
      
      // Wait for modal
      await expect(page.getByText('Select Shopping List')).toBeVisible();
      
      // Click create new list
      await page.getByRole('button', { name: /create new list for another store/i }).click();
      
      // Get available stores again
      const addToListAvailableButtons = await page.locator('button').filter({
        has: page.locator('.font-medium.text-gray-900')
      }).filter({
        hasNot: page.locator('text=/Back to lists|Cancel/')
      }).all();
      
      const addToListAvailableStores = [];
      for (const button of addToListAvailableButtons) {
        const storeName = await button.locator('.font-medium').textContent();
        addToListAvailableStores.push(storeName.trim());
      }
      
      console.log('Available stores in add-to-list modal:', addToListAvailableStores);
      
      // Check if the bug exists here too
      const addToListBuggyStores = addToListAvailableStores.filter(store => existingStoreNames.has(store));
      if (addToListBuggyStores.length > 0) {
        console.log('❌ BUG ALSO EXISTS in add-to-list page:', addToListBuggyStores);
      }
      
      // Test should fail to indicate the bug exists
      expect(buggyStores).toHaveLength(0);
    } else {
      console.log('✅ No bug found - filtering is working correctly');
    }
  });
});