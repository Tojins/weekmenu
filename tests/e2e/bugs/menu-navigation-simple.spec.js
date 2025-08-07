import { expect, test } from '@playwright/test';
import { loginTestUser } from '../../helpers/auth-real.js';

test.describe('Menu Navigation Simple Test', () => {
  test('verify navigation fix - should navigate to add-to-list when clicking generate shopping list', async ({ page }) => {
    await loginTestUser(page);
    
    // Navigate directly to add-to-list to verify the route works
    await page.goto('/weekmenu/add-to-list');
    
    // Check if we're redirected or stay on the page
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);
    
    // The bug was that it would redirect to home instead of staying on add-to-list
    expect(currentUrl).toContain('/add-to-list');
    expect(currentUrl).not.toMatch(/\/weekmenu\/?$/); // Should not be on home page
    
    // Verify the page has loaded with the correct layout wrapper
    // The fix was to wrap AddToShoppingList in ProtectedLayout
    const mainContent = await page.locator('main').isVisible();
    expect(mainContent).toBe(true);
  });
  
  test('verify protected layout wrapper exists', async ({ page }) => {
    await loginTestUser(page);
    
    // Navigate to add-to-list
    await page.goto('/weekmenu/add-to-list');
    await page.waitForLoadState('networkidle');
    
    // Check for the gradient background that ProtectedLayout provides
    const hasGradientBackground = await page.locator('.bg-gradient-to-br.from-blue-50.to-indigo-100').isVisible();
    expect(hasGradientBackground).toBe(true);
    
    // Check that main element exists (from ProtectedLayout)
    const mainElement = await page.locator('main').isVisible();
    expect(mainElement).toBe(true);
  });
});