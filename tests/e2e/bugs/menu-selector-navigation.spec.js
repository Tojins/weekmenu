import { expect, test } from '@playwright/test';
import { loginTestUser } from '../../helpers/auth-real.js';

test.describe('Menu Selector Navigation Bug', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test('should navigate to add-to-list page when clicking generate shopping list', async ({ page }) => {
    // Navigate to menu selector
    await page.goto('/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to fully load
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 });
    
    // Add at least one recipe to the menu
    const addButtons = page.getByRole('button', { name: 'Add to menu' });
    const addButtonCount = await addButtons.count();
    
    if (addButtonCount === 0) {
      // All recipes are already in menu, check if we have any recipes at all
      const removeButtons = await page.getByRole('button', { name: 'Remove from menu' }).count();
      if (removeButtons === 0) {
        // No recipes available, skip test
        test.skip();
        return;
      }
    } else {
      // Add a recipe to the menu
      await addButtons.first().click();
      await page.waitForTimeout(500);
    }
    
    // Check if sidebar is visible, if not, open it
    const generateButton = page.getByRole('button', { name: 'Generate shopping list' });
    const isGenerateButtonVisible = await generateButton.isVisible().catch(() => false);
    
    if (!isGenerateButtonVisible) {
      // Try to open the sidebar
      const sidebarToggle = page.getByTestId('sidebar-toggle-collapsed');
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Now the generate shopping list button should be visible
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    
    // Click the generate shopping list button
    await generateButton.click();
    
    // Verify navigation to add-to-list page
    await page.waitForURL('**/add-to-list', { timeout: 5000 });
    
    // Verify we're on the correct page and not redirected to home
    const currentUrl = page.url();
    expect(currentUrl).toContain('/add-to-list');
    expect(currentUrl).not.toMatch(/\/weekmenu\/?$/); // Should not be on home page
    
    // Verify the add-to-list page content is visible
    await expect(page.getByText(/Review Ingredients|Add.*Shopping List/i)).toBeVisible({ timeout: 5000 });
  });
});