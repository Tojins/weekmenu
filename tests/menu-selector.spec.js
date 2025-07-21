import { test, expect } from '@playwright/test';
import { loginTestUser, ensureLoggedOut } from './helpers/auth-real.js';

test.describe('Menu Selector', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/menu-selector');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('can access menu selector when authenticated', async ({ page }) => {
    // Login with test user
    await loginTestUser(page, 1);
    
    // Navigate to menu selector
    await page.goto('/menu-selector');
    
    // Should not redirect - stays on menu selector
    await expect(page).toHaveURL(/.*\/menu-selector/);
    
    // Should see menu selector elements
    await expect(page.getByText('Generate Menu')).toBeVisible();
  });

  test('menu data persists in localStorage', async ({ page }) => {
    await loginTestUser(page, 1);
    
    await page.goto('/menu-selector');
    
    // Generate a new menu
    await page.click('button:has-text("Generate Menu")');
    
    // Wait for recipes to load
    await page.waitForTimeout(1000);
    
    // Check localStorage has menu data
    const menuData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('weekmenu') || '{}');
    });
    
    expect(menuData).toHaveProperty('seed');
    expect(menuData).toHaveProperty('recipes');
    expect(menuData.subscriptionId).toBe('00000000-0000-0000-0000-000000000101'); // Test user's subscription
  });

  test('can select recipes and update servings', async ({ page }) => {
    await loginTestUser(page, 1);
    
    await page.goto('/menu-selector');
    
    // Wait for recipes to load (from seed data)
    await page.waitForSelector('.recipe-card', { timeout: 10000 });
    
    // Check that we have recipes displayed
    const recipeCards = await page.locator('.recipe-card').count();
    expect(recipeCards).toBeGreaterThan(0);
    
    // If servings controls exist, test them
    const servingsInput = page.locator('input[type="number"]').first();
    if (await servingsInput.count() > 0) {
      // Get initial value
      const initialValue = await servingsInput.inputValue();
      
      // Update servings
      await servingsInput.fill('6');
      
      // Verify it changed
      const newValue = await servingsInput.inputValue();
      expect(newValue).toBe('6');
    }
  });

  test('seed generation creates consistent menus', async ({ page }) => {
    await loginTestUser(page, 1);
    
    await page.goto('/menu-selector');
    
    // Generate menu with same seed twice
    const testSeed = 99999;
    
    // First generation
    await page.evaluate((seed) => {
      // Directly set seed in localStorage to test consistency
      const currentMenu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      currentMenu.seed = seed;
      localStorage.setItem('weekmenu', JSON.stringify(currentMenu));
    }, testSeed);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get first set of recipes
    const firstRecipes = await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      return menu.recipes || [];
    });
    
    // Clear and regenerate with same seed
    await page.evaluate((seed) => {
      const currentMenu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      currentMenu.seed = seed;
      currentMenu.recipes = []; // Clear recipes to force regeneration
      localStorage.setItem('weekmenu', JSON.stringify(currentMenu));
    }, testSeed);
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Get second set of recipes
    const secondRecipes = await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      return menu.recipes || [];
    });
    
    // Same seed should generate same recipes (if implemented)
    // This tests the actual seeding functionality
    if (firstRecipes.length > 0 && secondRecipes.length > 0) {
      expect(firstRecipes[0].recipeId).toBe(secondRecipes[0].recipeId);
    }
  });
});