import { test, expect } from '@playwright/test';
import { loginWithStorageState } from '../../helpers/auth-persistent';

test.describe('Test filtering with existing lists', () => {
  test.use({ 
    timeout: 45000 
  });

  test.beforeEach(async ({ page }) => {
    await loginWithStorageState(page);
    
    // Clean up any existing shopping lists for test stores
    await page.evaluate(async () => {
      const { supabase } = window;
      
      // Get test user's subscription
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('subscription_id')
        .eq('id', userData.user.id)
        .single();
      
      if (!userProfile?.subscription_id) return;
      
      // Delete existing test store lists
      await supabase
        .from('shopping_lists')
        .delete()
        .eq('subscription_id', userProfile.subscription_id)
        .in('store_id', [
          'e1b4f4f7-89b9-4b41-8dad-99e600f4fe59', // Test Store 1
          'a3c4f9b2-1234-5678-9abc-def012345678'  // Test Store 2
        ]);
    });
  });

  test('create lists then verify filtering works', async ({ page }) => {
    // Navigate to home
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Wait for shopping lists section
    await page.waitForSelector('h2:has-text("Shopping Lists")', { timeout: 10000 });
    
    // First, create a list for Test Store 1
    console.log('Creating a list for Test Store 1...');
    await page.getByRole('button', { name: 'New List' }).click();
    await expect(page.getByText('Create New Shopping List')).toBeVisible();
    
    // Find and click Test Store 1
    const testStore1Button = await page.locator('.fixed button').filter({
      has: page.locator('text=Test Store 1')
    }).first();
    
    await testStore1Button.click();
    
    // Wait for list to be created and navigate back to home
    await page.waitForTimeout(2000);
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Verify the list was created
    const createdList = await page.locator('.bg-white.rounded-lg.shadow').filter({
      has: page.locator('text=Test Store 1')
    }).first();
    
    await expect(createdList).toBeVisible();
    console.log('✅ Successfully created list for Test Store 1');
    
    // Now try to create another list
    console.log('Attempting to create another list...');
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
    
    console.log('Available stores after creating Test Store 1 list:', availableStoreNames);
    
    // VERIFY: Test Store 1 should NOT be available anymore
    const testStore1Available = availableStoreNames.includes('Test Store 1');
    expect(testStore1Available).toBe(false);
    console.log('✅ Test Store 1 is correctly filtered out');
    
    // VERIFY: Test Store 2 should still be available
    const testStore2Available = availableStoreNames.includes('Test Store 2');
    expect(testStore2Available).toBe(true);
    console.log('✅ Test Store 2 is still available');
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Test from add-to-list page
    console.log('Testing from add-to-list page...');
    
    // First ensure we have recipes
    await page.goto('/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');
    
    const selectedCount = await page.locator('.bg-red-500').count();
    if (selectedCount === 0) {
      await page.locator('button:has-text("Select for menu")').first().click();
      await page.waitForTimeout(1000);
    }
    
    // Go to add-to-list
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    await expect(page.getByText('Add to Shopping List')).toBeVisible();
    
    // Click change list
    await page.getByRole('button', { name: /change list/i }).click();
    await expect(page.getByText('Select Shopping List')).toBeVisible();
    
    // Should see Test Store 1 in the list
    await expect(page.getByText('Test Store 1')).toBeVisible();
    
    // Click create new list
    await page.getByRole('button', { name: /create new list for another store/i }).click();
    
    // Get available stores in add-to-list modal
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
    
    console.log('Available stores in add-to-list modal:', addToListStoreNames);
    
    // VERIFY: Same filtering behavior
    expect(addToListStoreNames.includes('Test Store 1')).toBe(false);
    expect(addToListStoreNames.includes('Test Store 2')).toBe(true);
    
    console.log('✅ Filtering works consistently between home and add-to-list pages');
  });
});