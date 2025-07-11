import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';

test.describe('Menu Selector with Mocked Auth', () => {
  test('full menu selector workflow', async ({ page }) => {
    // Set up auth mocks BEFORE any navigation
    await mockAuth(page);


    // Navigate to home first to initialize auth
    await page.goto('http://localhost:5173/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Now navigate to menu selector
    await page.goto('http://localhost:5173/weekmenu/menu-selector');

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // We should now be on the menu selector page
    // Wait for the grid to be visible (the component should show recipes)
    await page.waitForSelector('.grid', { timeout: 10000 });

    // Test 1: Check recipe cards are displayed
    const recipeCards = await page.locator('.grid > div').count();
    console.log(`Found ${recipeCards} recipe cards`);
    expect(recipeCards).toBeGreaterThan(0);

    // Test 2: Add a recipe
    await page.click('button:has-text("Add to menu"):first');
    
    // Check sidebar appears
    await expect(page.locator('text=Selected Recipes')).toBeVisible();

    // Test 3: Adjust servings
    await page.click('button:has-text("+"):first');
    
    // Test 4: Check localStorage
    const menuData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('weekmenu'));
    });
    
    expect(menuData).toBeTruthy();
    expect(menuData.recipes).toHaveLength(1);
    expect(menuData.seed).toBeGreaterThanOrEqual(1);
    expect(menuData.seed).toBeLessThanOrEqual(999999);

    // Test 5: Remove recipe
    await page.click('button:has-text("Remove")');
    
    // Sidebar should hide when no recipes
    await expect(page.locator('text=Selected Recipes')).not.toBeVisible();

    // Test 6: Add multiple recipes
    await page.click('button:has-text("Add to menu"):nth(0)');
    await page.click('button:has-text("Add to menu"):nth(1)');
    await page.click('button:has-text("Add to menu"):nth(2)');

    // Test 7: Close and reopen sidebar
    await page.click('button[aria-label="Close sidebar"], button:has(svg):near(:text("Selected Recipes"))');
    await expect(page.locator('text=3 recipes selected')).toBeVisible();
    
    await page.click('text=3 recipes selected');
    await expect(page.locator('text=Selected Recipes')).toBeVisible();

    // Test 8: Generate shopping list button
    await expect(page.locator('button:has-text("Generate shopping list")')).toBeVisible();

    console.log('All tests passed!');
  });
});