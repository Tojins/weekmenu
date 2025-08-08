import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Change List - Filter with existing data', () => {
  test.use({ 
    timeout: 45000 
  });

  test('filtering should work when lists already exist', async ({ page }) => {
    // Use persistent auth
    await loginWithStorageState(page);
    
    // First, ensure we have some recipes in the menu
    await page.goto('/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');
    
    // Check if we already have recipes
    const selectedCount = await page.locator('.bg-red-500').count();
    if (selectedCount < 2) {
      // Select a couple of recipes
      const selectButtons = await page.locator('button:has-text("Select for menu")').all();
      const toSelect = Math.min(2 - selectedCount, selectButtons.length);
      for (let i = 0; i < toSelect; i++) {
        await selectButtons[i].click();
        await page.waitForTimeout(500);
      }
    }
    
    // Go to home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Check initial state
    const initialLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).count();
    
    console.log(`Starting with ${initialLists} existing lists`);
    
    // Create a new list if we don't have any
    if (initialLists === 0) {
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
      await page.waitForTimeout(2000); // Wait for list creation
    }
    
    // Refresh to ensure we have latest data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get existing lists after creation
    const existingListElements = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    const existingStoreNames = new Set();
    for (const element of existingListElements) {
      const storeName = await element.locator('.font-medium').first().textContent();
      existingStoreNames.add(storeName.trim());
    }
    
    console.log('Existing lists for stores:', Array.from(existingStoreNames));
    
    // Now test the New List modal
    await page.getByRole('button', { name: 'New List' }).click();
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    // Get available stores
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
    
    // Check for the bug
    const duplicates = availableStoreNames.filter(store => existingStoreNames.has(store));
    
    if (duplicates.length > 0) {
      console.log('❌ BUG FOUND: These stores have lists but still appear:', duplicates);
    } else {
      console.log('✅ Filtering works correctly from home page');
    }
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Test from add-to-list page
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for page
    await expect(page.getByText('Add to Shopping List')).toBeVisible({ timeout: 10000 });
    
    // Click Change List
    await page.getByRole('button', { name: /change list/i }).click();
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Get lists shown in the selector
    const selectorLists = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Create new list|Cancel/')
    }).all();
    
    const selectorStoreNames = new Set();
    for (const button of selectorLists) {
      const storeName = await button.locator('.font-medium').textContent();
      selectorStoreNames.add(storeName.trim());
    }
    
    console.log('Lists shown in selector:', Array.from(selectorStoreNames));
    
    // Click create new list
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    // Check available stores
    const addToListAvailable = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();
    
    const addToListStoreNames = [];
    for (const button of addToListAvailable) {
      const storeName = await button.locator('.font-medium').textContent();
      addToListStoreNames.push(storeName.trim());
    }
    
    console.log('Available stores in add-to-list:', addToListStoreNames);
    
    // Check for duplicates
    const addToListDuplicates = addToListStoreNames.filter(store => selectorStoreNames.has(store));
    
    if (addToListDuplicates.length > 0) {
      console.log('❌ BUG IN ADD-TO-LIST: These stores have lists but still appear:', addToListDuplicates);
      expect(addToListDuplicates).toHaveLength(0); // This will fail and show the bug
    } else {
      console.log('✅ Filtering works correctly in add-to-list page');
    }
  });
});