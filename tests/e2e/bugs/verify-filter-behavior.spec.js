import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Verify store filtering behavior', () => {
  test.use({ 
    timeout: 30000 
  });

  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page);
  });

  test('verify current filtering behavior', async ({ page }) => {
    // Go to home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Get existing shopping lists
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').filter({ 
      has: page.locator('text=/items/') 
    }).all();
    
    console.log(`Found ${existingLists.length} existing shopping lists`);
    
    const existingStoreNames = [];
    for (const list of existingLists) {
      const storeName = await list.locator('.font-medium').first().textContent();
      existingStoreNames.push(storeName.trim());
    }
    
    console.log('Stores with existing lists:', existingStoreNames);
    
    // Try to create a new list
    await page.getByRole('button', { name: 'New List' }).click();
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    // Check if there are any available stores
    const availableStores = await page.locator('.fixed button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=Cancel')
    }).count();
    
    if (availableStores === 0) {
      console.log('✅ No stores available - all stores have lists');
      await expect(page.getByText('All stores already have active shopping lists.')).toBeVisible();
    } else {
      console.log(`Found ${availableStores} available stores`);
      
      // Get their names
      const availableButtons = await page.locator('.fixed button').filter({
        has: page.locator('.font-medium')
      }).filter({
        hasNot: page.locator('text=Cancel')
      }).all();
      
      for (const button of availableButtons) {
        const storeName = await button.locator('.font-medium').textContent();
        console.log('Available store:', storeName.trim());
      }
    }
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Add a recipe if needed to access add-to-list
    const recipeCount = await page.locator('.grid img').count();
    if (recipeCount === 0) {
      await page.goto('/weekmenu/menu-selector');
      await page.waitForLoadState('networkidle');
      
      const firstSelectButton = page.locator('button:has-text("Select for menu")').first();
      await firstSelectButton.waitFor({ timeout: 5000 });
      await firstSelectButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Test from add-to-list page
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText('Add to Shopping List')).toBeVisible();
    
    // Get the current list being used
    const currentStore = await page.locator('.bg-gray-50 .font-medium').textContent();
    console.log('Currently selected store:', currentStore);
    
    // Click Change List
    await page.getByRole('button', { name: /change list/i }).click();
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Check what lists are shown
    const shownLists = await page.locator('button').filter({
      has: page.locator('.font-medium.text-gray-900')
    }).filter({
      hasNot: page.locator('text=/Create new list|Cancel/')
    }).count();
    
    console.log(`Change list modal shows ${shownLists} existing lists`);
    
    // Try to create new list
    const createNewButton = page.getByRole('button', { name: /create new list for another store/i });
    const hasCreateButton = await createNewButton.isVisible();
    
    if (hasCreateButton) {
      await createNewButton.click();
      
      // Check available stores
      const addToListAvailable = await page.locator('button').filter({
        has: page.locator('.font-medium.text-gray-900')
      }).filter({
        hasNot: page.locator('text=/Back to lists|Cancel/')
      }).count();
      
      if (addToListAvailable === 0) {
        console.log('✅ No stores available in add-to-list - all stores have lists');
        await expect(page.getByText('All stores already have active shopping lists.')).toBeVisible();
      } else {
        console.log(`Found ${addToListAvailable} available stores in add-to-list modal`);
        
        // Get their names and check against existing
        const buttons = await page.locator('button').filter({
          has: page.locator('.font-medium.text-gray-900')
        }).filter({
          hasNot: page.locator('text=/Back to lists|Cancel/')
        }).all();
        
        for (const button of buttons) {
          const storeName = await button.locator('.font-medium').textContent();
          const trimmedName = storeName.trim();
          
          // Check if this store already has a list
          const alreadyHasList = existingStoreNames.some(existing => 
            existing.includes(trimmedName) || trimmedName.includes(existing)
          );
          
          if (alreadyHasList) {
            console.log(`❌ BUG: Store "${trimmedName}" has a list but is shown as available!`);
          } else {
            console.log(`✅ Store "${trimmedName}" correctly shown as available`);
          }
        }
      }
    } else {
      console.log('No "Create new list" button - all stores likely have lists');
    }
  });
});