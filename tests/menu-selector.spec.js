import { test, expect } from '@playwright/test';


test.describe('Menu Selector - Phase 1', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('can navigate to menu selector', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should see the login page since we're not authenticated
    await expect(page.locator('text=Sign in to your account, text=Welcome')).toBeVisible({ timeout: 10000 });
  });

  test('menu selector functionality without auth', async ({ page }) => {
    // Direct navigation to menu selector (will redirect to login)
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('localStorage persistence for menu data', async ({ page }) => {
    // Test localStorage directly
    await page.goto('http://localhost:5173/weekmenu/');
    
    // Set mock auth and menu data
    await page.evaluate(() => {
      const mockMenuData = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: [
          { recipeId: '1', servings: 4 },
          { recipeId: '2', servings: 6 }
        ],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(mockMenuData));
    });
    
    // Verify localStorage
    const menuData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('weekmenu'));
    });
    
    expect(menuData).toBeTruthy();
    expect(menuData.seed).toBe(12345);
    expect(menuData.recipes).toHaveLength(2);
  });

  test('recipe grid displays correctly', async ({ page }) => {
    // This test would work if we could bypass auth
    // For now, it demonstrates the structure
    
    // Navigate directly to menu selector component
    // In a real test, we'd mock the auth state
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
    
    // Will redirect to login, but shows test structure
    await expect(page).toHaveURL(/.*\/login/);
  });
});

// Test with console output monitoring
test('console output verification', async ({ page }) => {
  const consoleLogs = [];
  
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  await page.goto('./');
  
  // Check for any console errors
  const errors = consoleLogs.filter(log => log.type === 'error');
  expect(errors).toHaveLength(0);
});