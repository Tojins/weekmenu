import { test, expect } from '../../fixtures/menu.fixture';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Change List - Filter existing lists bug', () => {
  test.use({ 
    timeout: 30000 
  });

  test.beforeEach(async ({ page }) => {
    // Log console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    // Use persistent auth
    await loginWithStorageState(page);
  });

  test('should filter out stores that already have lists when clicking Change List', async ({ page, weekMenuWithRecipes }) => {
    // Use the fixture to set up menu
    await weekMenuWithRecipes;
    
    // Now get existing lists
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Get current lists from home page
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    const existingStoreNames = [];
    for (const list of existingLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      existingStoreNames.push(storeName.trim());
    }
    console.log('Existing lists for stores:', existingStoreNames);
    
    // Navigate to add-to-list page
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to load
    await expect(page.getByText('Add to Shopping List')).toBeVisible();

    // Click the Change List button
    await page.getByRole('button', { name: /change list/i }).click();

    // Wait for the modal to appear
    await expect(page.getByText('Select Shopping List')).toBeVisible();

    // Click "Create new list for another store" button
    await page.getByRole('button', { name: /create new list for another store/i }).click();

    // Should now see the store selection
    await expect(page.getByText('Select a store for your new list:')).toBeVisible();

    // Get all available store buttons
    const availableStores = await page.locator('button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();

    // Check that stores with existing lists are NOT shown
    for (const store of availableStores) {
      const storeName = await store.locator('.font-medium').textContent();
      expect(existingStoreNames).not.toContain(storeName.trim());
    }
    
    console.log(`Available stores count: ${availableStores.length}`);
    
    // If no stores are available, we should see the appropriate message
    if (availableStores.length === 0) {
      await expect(page.getByText('All stores already have active shopping lists.')).toBeVisible();
    }
  });

  test('should properly share functionality between home page and add-to-list page', async ({ page }) => {
    // Start on home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for Shopping Lists section
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // Click "New List" from home page
    await page.getByRole('button', { name: 'New List' }).click();
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    // Get available stores from home page modal
    const homeModalStores = await page.locator('.fixed button').filter({ 
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=Cancel') 
    }).all();
    
    const homeStoreNames = [];
    for (const store of homeModalStores) {
      const name = await store.locator('.font-medium').textContent();
      homeStoreNames.push(name.trim());
    }
    
    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Navigate to add-to-list page
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    // Click change list
    await page.getByRole('button', { name: /change list/i }).click();
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Click create new list
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    // Get available stores from add-to-list modal
    const addToListModalStores = await page.locator('button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=/Back to lists|Cancel/')
    }).all();
    
    const addToListStoreNames = [];
    for (const store of addToListModalStores) {
      const name = await store.locator('.font-medium').textContent();
      addToListStoreNames.push(name.trim());
    }
    
    // Both should show the same available stores
    expect(homeStoreNames.sort()).toEqual(addToListStoreNames.sort());
    console.log('Both modals show the same available stores:', homeStoreNames.length === addToListStoreNames.length);
  });
});