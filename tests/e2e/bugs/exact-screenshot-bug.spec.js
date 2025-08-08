import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Exact bug from user screenshot', () => {
  test.use({ 
    timeout: 45000 
  });

  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page);
  });

  test('Store appears in both existing lists AND available options', async ({ page }) => {
    // Go directly to home
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists to load
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    await page.waitForTimeout(2000); // Extra wait for data
    
    // Get all existing shopping lists
    const existingLists = await page.locator('.bg-white.rounded-lg.shadow').all();
    
    const existingStoreInfo = [];
    for (const list of existingLists) {
      // Check if this is a shopping list (has items count)
      const hasItemsText = await list.locator('text=/items/').count() > 0;
      if (hasItemsText) {
        const storeName = await list.locator('.font-medium').first().textContent();
        existingStoreInfo.push({
          name: storeName.trim(),
          element: list
        });
        console.log(`Found existing list for: ${storeName.trim()}`);
      }
    }
    
    if (existingStoreInfo.length === 0) {
      console.log('No existing lists found, cannot reproduce bug');
      return;
    }
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: 'before-clicking-new-list.png', 
      fullPage: true 
    });
    
    // Click New List
    await page.getByRole('button', { name: 'New List' }).click();
    
    // Wait for modal
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    // Check if we see "All stores already have active shopping lists" message
    const noStoresMessage = await page.locator('text=All stores already have active shopping lists').isVisible();
    
    if (noStoresMessage) {
      console.log('All stores have lists - no bug to test');
      return;
    }
    
    // Get all available store options in the modal
    const modalStoreButtons = await page.locator('.fixed button').filter({
      has: page.locator('.font-medium')
    }).filter({
      hasNot: page.locator('text=Cancel')
    }).all();
    
    console.log(`Modal shows ${modalStoreButtons.length} available store options`);
    
    // Check each available store
    for (const button of modalStoreButtons) {
      const modalStoreName = await button.locator('.font-medium').textContent();
      const trimmedModalName = modalStoreName.trim();
      
      // Check against existing lists
      for (const existing of existingStoreInfo) {
        // Check for exact match or partial match (e.g., "Colruyt Linkeroever" matches "Colruyt Linkeroever")
        if (trimmedModalName === existing.name || 
            trimmedModalName.includes(existing.name) || 
            existing.name.includes(trimmedModalName)) {
          
          console.log(`❌ BUG FOUND: "${trimmedModalName}" appears as available but "${existing.name}" already has a list!`);
          
          // Highlight the duplicate for screenshot
          await existing.element.evaluate(el => {
            el.style.border = '3px solid red';
            el.style.boxShadow = '0 0 10px red';
          });
          
          await button.evaluate(el => {
            el.style.border = '3px solid red';
            el.style.boxShadow = '0 0 10px red';
          });
          
          // Take screenshot showing the bug
          await page.screenshot({ 
            path: 'bug-evidence-duplicate-store.png', 
            fullPage: true 
          });
          
          throw new Error(
            `BUG CONFIRMED: Store "${trimmedModalName}" appears in the "Create New List" modal ` +
            `even though "${existing.name}" already has an active shopping list!`
          );
        }
      }
    }
    
    console.log('No duplicate stores found');
  });
});