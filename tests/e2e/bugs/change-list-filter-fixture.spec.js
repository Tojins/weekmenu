import { test, expect } from '../../fixtures/shopping-list.fixture';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Change List - Store filtering with fixtures', () => {
  test.use({ 
    timeout: 45000 
  });

  test.beforeEach(async ({ page }) => {
    // Use persistent auth
    await loginWithStorageState(page);
  });

  test('stores with existing lists should not appear in create new list modal', async ({ fullTestSetup }) => {
    const { page, existingStoreNames } = fullTestSetup;
    
    console.log('Test setup - existing lists for stores:', existingStoreNames);
    
    // Test from home page first
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Click New List
    await page.getByRole('button', { name: 'New List' }).click();
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    // Get all available store buttons
    const homeAvailableStores = await page.locator('.fixed button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=Cancel')
    }).all();
    
    const homeAvailableNames = [];
    for (const button of homeAvailableStores) {
      const storeName = await button.locator('.font-medium').textContent();
      homeAvailableNames.push(storeName.trim());
    }
    
    console.log('Home page - available stores:', homeAvailableNames);
    
    // Check that existing stores are NOT in available list
    for (const existingStore of existingStoreNames) {
      const isShownAsAvailable = homeAvailableNames.some(available => 
        available.includes(existingStore) || existingStore.includes(available)
      );
      expect(isShownAsAvailable).toBe(false);
    }
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Now test from add-to-list page
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText('Add to Shopping List')).toBeVisible();
    
    // Click Change List
    await page.getByRole('button', { name: /change list/i }).click();
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Verify existing lists are shown
    const shownLists = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Create new list|Cancel/')
    }).all();
    
    console.log(`Add-to-list page - ${shownLists.length} existing lists shown`);
    
    // Click create new list
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    // Should show store selection
    await expect(page.getByText('Select a store for your new list:')).toBeVisible();
    
    // Get available stores in add-to-list modal
    const addToListAvailable = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();
    
    const addToListNames = [];
    for (const button of addToListAvailable) {
      const storeName = await button.locator('.font-medium').textContent();
      addToListNames.push(storeName.trim());
    }
    
    console.log('Add-to-list page - available stores:', addToListNames);
    
    // Check filtering
    for (const existingStore of existingStoreNames) {
      const isShownAsAvailable = addToListNames.some(available => 
        available.includes(existingStore) || existingStore.includes(available)
      );
      if (isShownAsAvailable) {
        throw new Error(`BUG: Store "${existingStore}" has a list but is shown as available in add-to-list page!`);
      }
    }
    
    // If we have no available stores, we should see the message
    if (addToListAvailable.length === 0) {
      await expect(page.getByText('All stores already have active shopping lists.')).toBeVisible();
    }
    
    console.log('✅ All tests passed - filtering works correctly');
  });
  
  test('data consistency between home and add-to-list modals', async ({ fullTestSetup }) => {
    const { page } = fullTestSetup;
    
    // Get available stores from home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'New List' }).click();
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    const homeStores = await page.locator('.fixed button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=Cancel')
    }).all();
    
    const homeStoreNames = new Set();
    for (const button of homeStores) {
      const name = await button.locator('.font-medium').textContent();
      homeStoreNames.add(name.trim());
    }
    
    await page.keyboard.press('Escape');
    
    // Get available stores from add-to-list page  
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: /change list/i }).click();
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    const addToListStores = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();
    
    const addToListStoreNames = new Set();
    for (const button of addToListStores) {
      const name = await button.locator('.font-medium').textContent();
      addToListStoreNames.add(name.trim());
    }
    
    // Both should show exactly the same stores
    console.log('Home available stores:', Array.from(homeStoreNames));
    console.log('Add-to-list available stores:', Array.from(addToListStoreNames));
    
    expect(homeStoreNames.size).toBe(addToListStoreNames.size);
    
    for (const store of homeStoreNames) {
      expect(addToListStoreNames.has(store)).toBe(true);
    }
  });
});