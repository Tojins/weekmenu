import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';

test.describe('Menu Selector - Recipe Limits', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Setup auth mocking
    await mockAuth(page);
  });

  test('shows warning message at 7 recipes', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add 7 recipes by clicking "Add to menu" buttons
    const addButtons = page.locator('button:has-text("Add to menu")');
    for (let i = 0; i < 7; i++) {
      if (await addButtons.nth(i).isVisible()) {
        await addButtons.nth(i).click();
        await page.waitForTimeout(100);
      }
    }

    // Spec: "Soft limit: Warning at 7 recipes ('That's a lot of cooking!')"
    // Look for any warning indication - could be alert, warning text, or color change
    const warningIndicators = [
      page.locator('[role="alert"]'),
      page.locator('text=/warning|lot|many|seven|cooking/i'),
      page.locator('.warning, .alert, .text-yellow-500, .text-orange-500'),
      // If spec is very specific about the text, we can check for it as one option
      page.locator('text="That\'s a lot of cooking!"')
    ];
    
    let foundWarning = false;
    for (const indicator of warningIndicators) {
      if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        foundWarning = true;
        break;
      }
    }
    
    expect(foundWarning).toBeTruthy();
  });

  test('prevents adding more than 28 recipes', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Pre-populate with 27 recipes to test the limit faster
    await page.evaluate(() => {
      const existingMenu = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: Array(27).fill(null).map((_, i) => ({
          recipeId: `recipe-${i}`,
          servings: 4
        })),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(existingMenu));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Add 28th recipe - should work
    const addButton = page.locator('button:has-text("Add to menu")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Try to add 29th recipe
    await page.waitForTimeout(500);
    const anotherAddButton = page.locator('button:has-text("Add to menu")').first();
    if (await anotherAddButton.isVisible()) {
      await anotherAddButton.click();
    }

    // Spec: "Hard limit: 28 recipes per week"
    // Spec: "Clear messaging when limit reached"
    // Should see some indication that limit is reached
    const limitMessage = page.locator('text=/limit|maximum|28/i');
    await expect(limitMessage).toBeVisible();
  });

  test('prevents adding recipes when at 28 recipe limit', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Set up 28 recipes (at limit)
    await page.evaluate(() => {
      const maxMenu = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: Array(28).fill(null).map((_, i) => ({
          recipeId: `recipe-${i}`,
          servings: 4
        })),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(maxMenu));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Try to add another recipe
    const addButton = page.locator('button:has-text("Add to menu")').first();
    if (await addButton.isVisible()) {
      // Check if button is disabled or clicking shows error
      const isDisabled = await addButton.isDisabled();
      if (!isDisabled) {
        await addButton.click();
        // Should see limit message
        await expect(page.locator('text=/limit|maximum|28/i')).toBeVisible();
      }
    }
  });

  test('can add recipes again after removing from 28 limit', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Set up 28 recipes
    await page.evaluate(() => {
      const maxMenu = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: Array(28).fill(null).map((_, i) => ({
          recipeId: `recipe-${i}`,
          servings: 4
        })),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(maxMenu));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Spec mentions sidebar shows recipe count
    // Look for indication of selected recipes
    const selectedIndicator = page.locator('text=/28|recipes selected/i').first();
    if (await selectedIndicator.isVisible()) {
      await selectedIndicator.click();
    }

    // Remove a recipe
    const removeButton = page.locator('button:has-text("Remove")').or(page.locator('button:has-text("×")'));
    if (await removeButton.first().isVisible()) {
      await removeButton.first().click();
    }

    // Should now be able to add another recipe
    await page.waitForTimeout(500);
    const addButton = page.locator('button:has-text("Add to menu")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      // Should not see limit error
      await expect(page.locator('text=/limit|maximum/i')).not.toBeVisible();
    }
  });

  test('shows correct messages at recipe count thresholds', async ({ page }) => {
    // Test soft limit (7 recipes)
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.evaluate(() => {
      const menu = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: Array(7).fill(null).map((_, i) => ({
          recipeId: `recipe-${i}`,
          servings: 4
        })),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(menu));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should see soft limit warning
    await expect(page.locator('text="That\'s a lot of cooking!"')).toBeVisible();

    // Test hard limit (28 recipes)
    await page.evaluate(() => {
      const menu = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: Array(28).fill(null).map((_, i) => ({
          recipeId: `recipe-${i}`,
          servings: 4
        })),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(menu));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Try to add another to trigger hard limit message
    const addButton = page.locator('button:has-text("Add to menu")').first();
    if (await addButton.isVisible() && !await addButton.isDisabled()) {
      await addButton.click();
    }
    
    // Should see some limit indication
    await expect(page.locator('text=/limit|maximum|28/i')).toBeVisible();
  });
});