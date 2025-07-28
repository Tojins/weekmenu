import { test, expect } from '@playwright/test';

test.describe('Login-Logout-Login Home Page Shopping List Visibility', () => {
  test('shopping list panel should be visible on home page after re-login without navigation', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds for this complex flow
    
    // First login
    console.log('Step 1: First login');
    await page.goto('/weekmenu/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation away from login page
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
    
    // Verify first login successful - should be on home page
    await expect(page).toHaveURL(/\/weekmenu\/?$/);
    console.log('First login successful, on home page');
    
    // Check if Shopping Lists panel is visible on home page
    console.log('Step 2: Checking Shopping Lists panel on home page after first login');
    
    // Wait a bit for profile to load after first login
    await page.waitForTimeout(3000);
    
    // Look for shopping list functionality by checking for text content and ability to create lists
    const shoppingListsText = page.getByText('Shopping Lists');
    const isShoppingListsVisibleFirst = await shoppingListsText.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Shopping Lists text visible after first login:', isShoppingListsVisibleFirst);
    
    // Look for ability to create new shopping lists (button or link)
    const createListAction = page.getByRole('button', { name: /new list|create.*list/i }).or(page.getByRole('link', { name: /new list|create.*list/i }));
    const isCreateActionVisibleFirst = await createListAction.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Create list action visible after first login:', isCreateActionVisibleFirst);
    
    // Store initial visibility state
    const initialShoppingListsVisible = isShoppingListsVisibleFirst || isCreateActionVisibleFirst;
    
    // Navigate to Settings
    console.log('Step 3: Navigating to Settings');
    // Click on the Settings heading to navigate
    await page.getByRole('heading', { name: 'Settings' }).click();
    
    // Wait for settings page
    await page.waitForURL('**/weekmenu/settings', { timeout: 10000 });
    console.log('On settings page');
    
    // Logout
    console.log('Step 4: Logging out');
    const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    
    await logoutButton.click();
    await page.waitForURL('**/weekmenu/login', { timeout: 10000 });
    console.log('Logout successful');
    
    // Second login
    console.log('Step 5: Second login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation away from login page
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
    
    // Should be back on home page
    await expect(page).toHaveURL(/\/weekmenu\/?$/);
    console.log('Second login successful, on home page');
    
    // Check if Shopping Lists panel is visible on home page after re-login
    console.log('Step 6: Checking Shopping Lists panel on home page after re-login');
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Look for shopping list functionality
    const shoppingListsTextAfter = page.getByText('Shopping Lists');
    const isShoppingListsVisible = await shoppingListsTextAfter.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Shopping Lists text visible after re-login:', isShoppingListsVisible);
    
    // Look for ability to create new shopping lists
    const createListActionAfter = page.getByRole('button', { name: /new list|create.*list/i }).or(page.getByRole('link', { name: /new list|create.*list/i }));
    const isCreateButtonVisible = await createListActionAfter.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Create list action visible after re-login:', isCreateButtonVisible);
    
    // Log what sections are visible on the page
    const visibleSections = await page.getByRole('heading').allTextContents();
    console.log('Visible sections on page:', visibleSections);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/home-page-after-relogin.png', fullPage: true });
    
    // Store final visibility state
    const finalShoppingListsVisible = isShoppingListsVisible || isCreateButtonVisible;
    
    // Log the final state
    console.log('\nSummary:');
    console.log('- Shopping Lists functionality visible after first login:', initialShoppingListsVisible);
    console.log('- Shopping Lists functionality visible after re-login:', finalShoppingListsVisible);
    
    // The actual assertion - Shopping Lists should be visible
    if (!initialShoppingListsVisible) {
      console.log('\nISSUE: Shopping Lists functionality is not visible on first login');
    }
    if (!finalShoppingListsVisible) {
      console.log('\nBUG CONFIRMED: Shopping Lists functionality is not accessible on home page after re-login');
    } else {
      console.log('\nShopping Lists functionality is correctly visible after re-login');
    }
    
    // Shopping lists should be visible after login
    expect(finalShoppingListsVisible).toBe(true);
  });
});