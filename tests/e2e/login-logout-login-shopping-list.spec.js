import { test, expect } from '@playwright/test';

test.describe('Login-Logout-Login Shopping List Visibility', () => {
  test('shopping list panel shows existing lists and create button after re-login', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds for this complex flow
    
    // First login
    console.log('Step 1: First login');
    await page.goto('/weekmenu/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation away from login page
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
    
    // Verify first login successful - should be on home page
    await expect(page).toHaveURL(/\/weekmenu\/?$/);
    console.log('First login successful');
    
    // Navigate to shopping list
    await page.goto('/weekmenu/shopping-list');
    await page.waitForLoadState('networkidle');
    
    // Check initial state (should work on first login)
    console.log('Step 2: Checking initial shopping list state');
    // Look for either "Create Shopping List" or "New List" button
    const createButtonInitial = page.locator('button:has-text("Create Shopping List"), button:has-text("New List"), [aria-label="New List"]').first();
    await expect(createButtonInitial).toBeVisible({ timeout: 10000 });
    console.log('Create/New List button visible on first login');
    
    // Check if admin tools are visible (if user is admin)
    const adminToolsInitial = page.locator('text=Admin Tools').first();
    const isAdminInitial = await adminToolsInitial.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Admin tools visible on first login:', isAdminInitial);
    
    // Logout
    console.log('Step 3: Logging out');
    await page.goto('/weekmenu/settings');
    await page.waitForLoadState('networkidle');
    
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")').first();
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    
    await logoutButton.click();
    await page.waitForURL('**/weekmenu/login', { timeout: 10000 });
    
    console.log('Logout successful');
    
    // Second login
    console.log('Step 4: Second login');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation away from login page
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
    
    console.log('Second login successful');
    
    // Navigate back to shopping list
    console.log('Step 5: Checking shopping list after re-login');
    await page.goto('/weekmenu/shopping-list');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for React to render
    await page.waitForTimeout(2000);
    
    // Check if create button is visible after re-login
    const createButtonAfter = page.locator('button:has-text("Create Shopping List"), button:has-text("New List"), [aria-label="New List"]').first();
    const isCreateButtonVisible = await createButtonAfter.isVisible({ timeout: 10000 }).catch(() => false);
    console.log('Create/New List button visible after re-login:', isCreateButtonVisible);
    
    // Check if shopping lists are loaded
    const shoppingListsContainer = page.locator('[data-testid="shopping-lists-container"], .shopping-lists-container, div:has(> button:has-text("Create Shopping List"))');
    const containerExists = await shoppingListsContainer.count() > 0;
    console.log('Shopping lists container exists:', containerExists);
    
    // Check if admin tools are visible after re-login (if user is admin)
    const adminToolsAfter = page.locator('text=Admin Tools').first();
    const isAdminAfter = await adminToolsAfter.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Admin tools visible after re-login:', isAdminAfter);
    
    // Log page content for debugging
    const pageContent = await page.locator('body').textContent();
    console.log('Page contains "Loading":', pageContent.includes('Loading'));
    console.log('Page contains "Create Shopping List":', pageContent.includes('Create Shopping List'));
    console.log('Page contains "New List":', pageContent.includes('New List'));
    console.log('Page contains "Admin Tools":', pageContent.includes('Admin Tools'));
    
    // The actual assertions - these should pass but might fail based on the bug
    await expect(createButtonAfter).toBeVisible({ timeout: 10000 });
    
    // If admin tools were visible initially, they should be visible after re-login too
    if (isAdminInitial) {
      await expect(adminToolsAfter).toBeVisible({ timeout: 5000 });
    }
  });
});