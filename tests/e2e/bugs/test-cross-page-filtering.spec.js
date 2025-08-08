import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Test cross-page filtering bug', () => {
  test.use({ 
    timeout: 45000 
  });

  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page);
  });

  test('lists visible on home should be filtered in add-to-list modal', async ({ page }) => {
    // First, go to home and check what lists are visible
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists section
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // Wait for shopping lists to load - wait for at least one list or the "New List" button
    await page.waitForSelector('.bg-white.rounded-lg.shadow, button:has-text("New List")', { timeout: 10000 });
    
    // Extra wait for data to settle
    await page.waitForTimeout(2000);
    
    // Get all visible shopping lists on home page - look for shopping cart icon and items text
    const homeLists = await page.locator('button').filter({ 
      has: page.locator('text=items') 
    }).filter({
      hasNot: page.locator('text=New List')
    }).all();
    
    const homeStoreNames = [];
    for (const list of homeLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      homeStoreNames.push(storeName.trim());
    }
    
    console.log('Lists visible on home page:', homeStoreNames);
    
    // Click on recipe selector to go to menu selector page
    await page.locator('text=Click to browse recipes').click();
    await page.waitForLoadState('networkidle');
    
    // Check if we have any recipes selected
    const hasSelectedRecipes = await page.locator('text=recipe selected').isVisible().catch(() => false);
    
    if (!hasSelectedRecipes) {
      console.log('No recipes selected, adding one');
      // Look for "Add to menu" button
      await page.locator('button:has-text("Add to menu")').first().click();
      await page.waitForTimeout(1000);
    }
    
    // Click Generate shopping list button
    await page.getByRole('button', { name: 'Generate shopping list' }).click();
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText('Add to Shopping List')).toBeVisible();
    
    // Click Change List
    await page.getByRole('button', { name: /change list/i }).click();
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Get lists shown in the selector
    const selectorLists = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=Create new list')
    }).filter({
      hasNot: page.locator('text=Cancel')
    }).all();
    
    const selectorStoreNames = [];
    for (const button of selectorLists) {
      const storeName = await button.locator('.font-medium').textContent();
      selectorStoreNames.push(storeName.trim());
    }
    
    console.log('Lists in add-to-list selector:', selectorStoreNames);
    
    // BUG: The selector should show the same lists as the home page, but it's empty!
    if (selectorStoreNames.length === 0 && homeStoreNames.length > 0) {
      console.log('❌ BUG CONFIRMED: Add-to-list modal shows NO lists even though home page shows:', homeStoreNames);
      throw new Error(
        `BUG: The add-to-list page is not receiving shopping lists data properly. ` +
        `Home page shows ${homeStoreNames.length} lists but add-to-list modal shows 0 lists.`
      );
    }
    
    expect(selectorStoreNames.sort()).toEqual(homeStoreNames.sort());
    
    // Listen for console logs to capture debug info
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('NewListModal Debug')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Click "Create new list for another store"
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    // Should see store selection
    await expect(page.getByText('Select a store for your new list:')).toBeVisible();
    
    // Log the debug info
    console.log('Debug logs from NewListModal:', consoleLogs);
    
    // Check if the debug logs show 0 active lists
    const hasZeroActiveLists = consoleLogs.some(log => log.includes('activeLists: 0'));
    if (hasZeroActiveLists) {
      console.log('❌ NewListModal Debug confirms: activeLists: 0 (should be 3)');
    }
    
    // Get available stores
    const availableStores = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();
    
    const availableStoreNames = [];
    for (const button of availableStores) {
      const storeName = await button.locator('.font-medium').textContent();
      availableStoreNames.push(storeName.trim());
    }
    
    console.log('Available stores for new list:', availableStoreNames);
    
    // If we have some lists on home page, check for the bug
    if (homeStoreNames.length > 0) {
      // THE KEY TEST: Check if stores that have lists appear as available
      for (const existingStore of homeStoreNames) {
        const isAvailable = availableStoreNames.some(available => 
          available === existingStore || 
          available.includes(existingStore) || 
          existingStore.includes(available)
        );
        
        if (isAvailable) {
          console.log(`❌ BUG CONFIRMED: "${existingStore}" has a list but appears as available!`);
          
          // Take screenshot for evidence
          await page.screenshot({ 
            path: 'bug-confirmed-cross-page.png', 
            fullPage: true 
          });
          
          throw new Error(
            `BUG: Store "${existingStore}" is visible on home page (has a list) ` +
            `but still appears as an available option for creating a new list!`
          );
        }
      }
      
      console.log('✅ All stores with lists are properly filtered out');
    } else if (availableStoreNames.length === 0) {
      // Check the debug logs to see if lists were properly passed
      if (consoleLogs.some(log => log.includes('activeLists: 0'))) {
        throw new Error(
          'BUG: Modal shows 0 active lists even though lists exist in the database. ' +
          'This indicates the lists data is not being properly passed from add-to-list page.'
        );
      }
    }
  });
});