import { expect, test } from '@playwright/test';
import { loginTestUser } from '../../helpers/auth-real.js';

test.describe('Navigation to Add-to-List Bug', () => {
  test('should navigate to /add-to-list when clicking Generate shopping list - not to home page', async ({ page }) => {
    await loginTestUser(page);
    
    // First go to home to make sure we have a clean state
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Click on Recipe Selector to go to menu selector
    await page.getByRole('button', { name: /Recipe Selector/i }).click();
    await page.waitForURL('**/menu-selector');
    
    // Wait for the page to fully load
    await page.waitForTimeout(2000);
    
    // Add a recipe to the menu if not already added
    const addButtons = await page.getByRole('button', { name: 'Add to menu' }).all();
    if (addButtons.length > 0) {
      await addButtons[0].click();
    } else {
      // All recipes might already be added, that's OK
      console.log('No Add to menu buttons found, recipes might already be in menu');
    }
    
    // Wait for the sidebar to appear with the Generate shopping list button
    await page.waitForSelector('[data-testid="sidebar-toggle-collapsed"], .fixed.right-0', { timeout: 5000 });
    
    // Check if sidebar is collapsed, if so, open it
    const sidebarToggle = page.getByTestId('sidebar-toggle-collapsed');
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Find and click the Generate shopping list button
    const generateButton = page.getByRole('button', { name: 'Generate shopping list' });
    await expect(generateButton).toBeVisible();
    
    // Log the current URL before clicking
    const urlBefore = page.url();
    console.log('URL before clicking Generate shopping list:', urlBefore);
    
    // Click the button
    await generateButton.click();
    
    // Wait a moment for navigation
    await page.waitForTimeout(1000);
    
    // Get the URL after clicking
    const urlAfter = page.url();
    console.log('URL after clicking Generate shopping list:', urlAfter);
    
    // The bug: it navigates to home page instead of /add-to-list
    // This test should FAIL until the bug is fixed
    expect(urlAfter).toContain('/add-to-list');
    expect(urlAfter).not.toMatch(/\/weekmenu\/?$/); // Should NOT be on home page
    
    // Additional check: if we're on the add-to-list page, we should see ingredients
    // If we're on home page, we'll see the Recipe Selector panel
    const onAddToListPage = await page.locator('text=Adding recipes to').isVisible().catch(() => false) ||
                           await page.locator('button:has-text("Back")').isVisible().catch(() => false);
    const onHomePage = await page.locator('text=Recipe Selector').first().isVisible().catch(() => false);
    
    console.log('On add-to-list page:', onAddToListPage);
    console.log('On home page:', onHomePage);
    
    // We should be on add-to-list page, not home page
    expect(onAddToListPage).toBe(true);
    expect(onHomePage).toBe(false);
  });
});