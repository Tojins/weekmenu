import { test, expect } from '@playwright/test';
import { loginTestUser, ensureLoggedOut } from '../../../helpers/auth-real.js';

test.describe('Create Shopping List from Home Panel', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    await loginTestUser(page, 1);
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new shopping list from the home panel', async ({ page }) => {
    // Set up console error listener to catch API errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor ALL network requests to debug
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('supabase.co')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    // Wait for page to fully load
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 });
    
    // Wait a bit more for auth context to fully load
    await page.waitForTimeout(2000);
    
    // Get initial shopping list count
    const initialListLinks = await page.locator('a[href*="/shopping-list/"]').count();
    
    // Look for the "New List" button in Shopping Lists section
    const createButton = page.getByText('New List');
    
    // Verify button exists
    await expect(createButton).toBeVisible({ timeout: 5000 });
    
    // Check subscription data before clicking
    const subscriptionData = await page.evaluate(() => {
      const authContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.getFiberRoots()?.values()?.next()?.value?.current?.child?.memoizedProps?.value;
      // Simple way - check if subscription is available in console
      return { hasSubscription: !!window.subscription, consoleCheck: 'Check console for subscription' };
    });
    
    console.log('Subscription check:', subscriptionData);
    
    // Click the create button
    await createButton.click();
    
    // Wait a bit to see what happens
    await page.waitForTimeout(1000);
    
    // Check if a modal or store selector appeared
    const modalPresent = await page.locator('.fixed.inset-0').count() > 0;
    const selectPresent = await page.locator('select').count() > 0;
    
    console.log('Modal present:', modalPresent, 'Select present:', selectPresent);
    
    if (selectPresent) {
      // Store selector appeared - we need to select a store
      console.log('Store selector appeared - handling store selection');
      
      // Get available options
      const options = await page.locator('select option').all();
      const optionTexts = await Promise.all(options.map(opt => opt.textContent()));
      console.log('Available store options:', optionTexts);
      
      // Select the first non-placeholder option
      if (options.length > 1) {
        // Get the value of the first real option
        const firstStoreValue = await options[1].getAttribute('value');
        await page.locator('select').selectOption(firstStoreValue);
        
        // After selecting, we need to trigger the createList function
        // But there's no confirm button - the StoreSelector component doesn't have onConfirm
        // This is the bug - the component interface doesn't match its usage
        
        // Let me check if there's a submit button or if selection triggers creation
        await page.waitForTimeout(1000);
        
        // Look for the create button in the modal
        const createButton = page.getByRole('button', { name: /create shopping list/i });
        await expect(createButton).toBeVisible({ timeout: 5000 });
        
        // Wait for the POST request when clicking create
        const responsePromise = page.waitForResponse(
          response => response.url().includes('shopping_lists') && response.request().method() === 'POST',
          { timeout: 5000 }
        ).catch(() => null);
        
        await createButton.click();
        
        const response = await responsePromise;
        
        if (!response) {
          console.log('No response received after clicking Create Shopping List');
          console.log('API calls made:', apiCalls);
          throw new Error('No POST request to shopping_lists was made after clicking Create');
        }
        
        // Check if the API call was successful
        expect(response.status()).toBe(201); // Should be 201 Created
        
        // Get the response body to verify shopping list was created
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id');
        expect(responseBody).toHaveProperty('created_at');
      } else {
        throw new Error('No stores available to select');
      }
    } else if (!modalPresent) {
      // No UI change occurred
      console.log('handleCreateList was called but no UI change occurred');
      console.log('Console errors:', consoleErrors);
      throw new Error('Expected store selector to appear when no default store is set, but it did not appear');
    }
    
    // If we get here, shopping list creation should have been triggered
    // Wait for navigation to the new shopping list
    await page.waitForURL(/shopping-list\/[a-f0-9-]+/, { timeout: 5000 });
    
    // Verify we're on the shopping list page with correct heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    
    // Verify no console errors related to shopping list creation
    const relevantErrors = consoleErrors.filter(err => 
      err.includes('shopping') || err.includes('400') || err.includes('Error')
    );
    expect(relevantErrors).toEqual([]);
  });

  test('should display existing shopping lists on home panel', async ({ page }) => {
    // Wait for shopping lists section to load
    const shoppingListsSection = page.locator('h2:has-text("Shopping Lists")');
    await expect(shoppingListsSection).toBeVisible({ timeout: 10000 });
    
    // Check for shopping list items or empty state
    const shoppingListLinks = page.locator('a[href*="/shopping-list/"]');
    const listCount = await shoppingListLinks.count();
    
    if (listCount > 0) {
      // Verify at least one shopping list is displayed
      await expect(shoppingListLinks.first()).toBeVisible();
      
      // Click on a shopping list to verify navigation
      await shoppingListLinks.first().click();
      await page.waitForURL(/shopping-list/, { timeout: 5000 });
      
      // Verify we're on the shopping list page
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    } else {
      // Check for empty state message
      const emptyState = page.locator('text=/no shopping lists|create.*first.*list/i');
      const hasEmptyState = await emptyState.count() > 0;
      
      if (hasEmptyState) {
        await expect(emptyState.first()).toBeVisible();
      }
    }
  });

  test('should create shopping list from week menu if recipes exist', async ({ page }) => {
    // Check if there are recipes in the week menu
    const weekMenuSection = page.locator('text=/week menu|weekly menu/i').first();
    const hasWeekMenu = await weekMenuSection.count() > 0;
    
    if (hasWeekMenu) {
      // Look for generate shopping list button
      const generateButton = page.getByRole('button', { name: /generate shopping list|create.*from.*menu/i });
      
      if (await generateButton.count() > 0) {
        await generateButton.click();
        
        // Handle the modal flow
        await expect(page.getByRole('heading', { name: /shopping list/i })).toBeVisible({ timeout: 5000 });
        
        // Choose to create new list
        const createNewRadio = page.getByRole('radio', { name: /create new/i });
        if (await createNewRadio.count() > 0) {
          await createNewRadio.click();
        }
        
        // Submit
        const submitButton = page.getByRole('button', { name: /create|add to shopping list/i }).last();
        await submitButton.click();
        
        // Verify navigation to shopping list
        await page.waitForURL(/shopping-list/, { timeout: 5000 });
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        
        // Verify items were added
        const items = page.locator('input[type="number"]');
        await expect(items.first()).toBeVisible();
        expect(await items.count()).toBeGreaterThan(0);
      }
    }
  });
});