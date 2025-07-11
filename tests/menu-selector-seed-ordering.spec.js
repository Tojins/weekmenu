import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';

test.describe('Menu Selector - Seed-based Recipe Ordering', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Setup auth mocking
    await mockAuth(page);
  });

  test('creates menu with random seed on first recipe', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add first recipe
    const addButton = page.locator('button:has-text("Add to menu")').first();
    await addButton.click();

    // Spec: "Generate random seed (1-999999) when creating new week menu"
    const menuData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('weekmenu') || '{}');
    });

    expect(menuData.seed).toBeDefined();
    expect(menuData.seed).toBeGreaterThanOrEqual(1);
    expect(menuData.seed).toBeLessThanOrEqual(999999);
  });

  test('keeps same seed when adding more recipes', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add first recipe
    await page.locator('button:has-text("Add to menu")').first().click();

    // Get initial seed
    const initialSeed = await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      return menu.seed;
    });

    // Add more recipes
    const addButtons = page.locator('button:has-text("Add to menu")');
    if (await addButtons.nth(1).isVisible()) {
      await addButtons.nth(1).click();
    }
    if (await addButtons.nth(2).isVisible()) {
      await addButtons.nth(2).click();
    }

    // Seed should remain the same
    const currentSeed = await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      return menu.seed;
    });

    expect(currentSeed).toBe(initialSeed);
  });

  test('shows recipes in consistent order with same seed', async ({ page }) => {
    // Set specific seed
    await page.evaluate(() => {
      const menu = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: [],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(menu));
    });

    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Get recipe titles (from headings)
    const recipeTitles = page.locator('h3, h2').filter({ hasText: /\w+/ });
    const firstLoadTitles = await recipeTitles.allTextContents();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get titles again
    const secondLoadTitles = await recipeTitles.allTextContents();

    // Spec: "Recipe query implementation" with seed-based ordering
    // Order should be consistent
    expect(secondLoadTitles).toEqual(firstLoadTitles);
  });

  test('different seeds show different recipe ordering', async ({ page }) => {
    // First seed
    await page.evaluate(() => {
      const menu = {
        subscriptionId: 'test-sub-id',
        seed: 11111,
        version: 1,
        recipes: [],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(menu));
    });

    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    const recipeTitles = page.locator('h3, h2').filter({ hasText: /\w+/ });
    const firstSeedTitles = await recipeTitles.allTextContents();

    // Different seed
    await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      menu.seed = 99999;
      localStorage.setItem('weekmenu', JSON.stringify(menu));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const secondSeedTitles = await recipeTitles.allTextContents();

    // Different seeds should likely produce different ordering
    // (not guaranteed but very likely with good randomization)
    expect(secondSeedTitles.join()).not.toBe(firstSeedTitles.join());
  });

  test('seed provides variety in recipe display', async ({ page }) => {
    // This test verifies that the seed mechanism exists and provides variety
    // The spec mentions complex SQL implementation but we test the user-facing behavior
    
    const seeds = [12345, 54321];
    const recipeOrders = [];

    for (const seed of seeds) {
      await page.evaluate((s) => {
        const menu = {
          subscriptionId: 'test-sub-id',
          seed: s,
          version: 1,
          recipes: [],
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('weekmenu', JSON.stringify(menu));
      }, seed);

      await page.goto('http://localhost:5173/weekmenu/menu-selector');
      await page.waitForLoadState('networkidle');

      // Get first few recipe titles
      const titles = await page.locator('h3, h2').filter({ hasText: /\w+/ }).allTextContents();
      recipeOrders.push(titles.slice(0, 3).join(','));
    }

    // Different seeds should show recipes in different order
    // providing variety as mentioned in spec
    expect(recipeOrders[0]).not.toBe(recipeOrders[1]);
  });

  test('keeps seed when modifying recipe selection', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add recipe
    await page.locator('button:has-text("Add to menu")').first().click();

    const initialSeed = await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      return menu.seed;
    });

    // Look for selected recipes indicator
    const selectedIndicator = page.locator('text=/1 recipe|recipe selected/i').first();
    if (await selectedIndicator.isVisible()) {
      await selectedIndicator.click();
      
      // Remove recipe
      const removeButton = page.locator('button:has-text("Remove")').or(page.locator('button:has-text("×")'));
      if (await removeButton.first().isVisible()) {
        await removeButton.first().click();
      }
    }

    // Add another recipe
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Add to menu")').first().click();

    // Seed should be preserved throughout
    const finalSeed = await page.evaluate(() => {
      const menu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      return menu.seed;
    });

    expect(finalSeed).toBe(initialSeed);
  });
});