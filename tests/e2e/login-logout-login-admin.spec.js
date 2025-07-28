import { test, expect } from '@playwright/test';

test.describe('Login-Logout-Login Admin Panel Visibility', () => {
  test('admin tools panel shows after re-login for admin users', async ({ page }) => {
    test.setTimeout(60000); // 60 seconds for this complex flow
    
    // First create an admin user or use existing one
    // For this test, we'll need to verify with an actual admin user
    // You'll need to provide admin credentials
    
    console.log('This test requires admin credentials.');
    console.log('Please update the test with actual admin user credentials.');
    console.log('The test will check:');
    console.log('1. Admin tools visible on first login');
    console.log('2. Admin tools still visible after logout and re-login');
    
    // Admin test user credentials from seed.sql
    const ADMIN_EMAIL = 'testadmin@example.com';
    const ADMIN_PASSWORD = 'testpassword123'; // Same password as other test users
    
    // First login
    console.log('Step 1: First login as admin');
    await page.goto('/weekmenu/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    
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
    
    // Check for create button
    const createButtonInitial = page.locator('button:has-text("Create Shopping List"), button:has-text("New List"), [aria-label="New List"]').first();
    await expect(createButtonInitial).toBeVisible({ timeout: 10000 });
    console.log('Create/New List button visible on first login');
    
    // Check if admin tools are visible
    const adminToolsInitial = page.locator('text=Admin Tools').first();
    await expect(adminToolsInitial).toBeVisible({ timeout: 5000 });
    console.log('Admin tools visible on first login: true');
    
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
    console.log('Step 4: Second login as admin');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    
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
    
    // Check if admin tools are visible after re-login
    const adminToolsAfter = page.locator('text=Admin Tools').first();
    const isAdminAfter = await adminToolsAfter.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Admin tools visible after re-login:', isAdminAfter);
    
    // Log page content for debugging
    const pageContent = await page.locator('body').textContent();
    console.log('Page contains "Loading":', pageContent.includes('Loading'));
    console.log('Page contains "Admin Tools":', pageContent.includes('Admin Tools'));
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/admin-after-relogin.png', fullPage: true });
    
    // The actual assertions
    await expect(createButtonAfter).toBeVisible({ timeout: 10000 });
    await expect(adminToolsAfter).toBeVisible({ timeout: 5000 });
  });
});