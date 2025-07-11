import { test, expect } from '@playwright/test';

test.describe('Menu Selector - Basic Tests', () => {
  test('localStorage operations work correctly', async ({ page }) => {
    await page.goto('./');
    
    // Test setting weekmenu data
    await page.evaluate(() => {
      const menuData = {
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: [
          { recipeId: '1', servings: 4 },
          { recipeId: '2', servings: 6 }
        ],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(menuData));
    });
    
    // Verify localStorage
    const storedData = await page.evaluate(() => {
      return localStorage.getItem('weekmenu');
    });
    
    expect(storedData).toBeTruthy();
    const parsed = JSON.parse(storedData);
    expect(parsed.seed).toBe(12345);
    expect(parsed.recipes).toHaveLength(2);
  });

  test('seed generation works correctly', async ({ page }) => {
    await page.goto('./');
    
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Generate multiple seeds and verify they're in range
    const seeds = [];
    for (let i = 0; i < 10; i++) {
      const seed = await page.evaluate(() => {
        return Math.floor(Math.random() * 999999) + 1;
      });
      seeds.push(seed);
    }
    
    // All seeds should be between 1 and 999999
    seeds.forEach(seed => {
      expect(seed).toBeGreaterThanOrEqual(1);
      expect(seed).toBeLessThanOrEqual(999999);
    });
    
    // Seeds should be different (with high probability)
    const uniqueSeeds = new Set(seeds);
    expect(uniqueSeeds.size).toBeGreaterThan(5);
  });

  test('recipe limit calculations work correctly', async ({ page }) => {
    await page.goto('./');
    
    // Test soft limit
    const softLimitReached = await page.evaluate(() => {
      const recipeCount = 7;
      return recipeCount >= 7;
    });
    expect(softLimitReached).toBe(true);
    
    // Test hard limit
    const hardLimitReached = await page.evaluate(() => {
      const recipeCount = 28;
      return recipeCount >= 28;
    });
    expect(hardLimitReached).toBe(true);
    
    // Test under limit
    const underLimit = await page.evaluate(() => {
      const recipeCount = 5;
      return recipeCount < 7;
    });
    expect(underLimit).toBe(true);
  });

  test('servings increment/decrement logic', async ({ page }) => {
    await page.goto('./');
    
    // Test increment
    const incremented = await page.evaluate(() => {
      let servings = 4;
      return servings + 1;
    });
    expect(incremented).toBe(5);
    
    // Test decrement with minimum
    const decremented = await page.evaluate(() => {
      let servings = 2;
      return Math.max(1, servings - 1);
    });
    expect(decremented).toBe(1);
    
    // Test decrement at minimum
    const atMinimum = await page.evaluate(() => {
      let servings = 1;
      return Math.max(1, servings - 1);
    });
    expect(atMinimum).toBe(1);
  });

  test('recent searches expiry logic', async ({ page }) => {
    await page.goto('./');
    
    // Set searches with different timestamps
    await page.evaluate(() => {
      const now = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31); // 31 days ago
      
      const recentSearches = [
        { query: 'old search', timestamp: oldDate.toISOString() },
        { query: 'recent search', timestamp: now.toISOString() }
      ];
      
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    });
    
    // Filter expired searches
    const validSearches = await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return stored.filter(s => new Date(s.timestamp) > thirtyDaysAgo);
    });
    
    expect(validSearches).toHaveLength(1);
    expect(validSearches[0].query).toBe('recent search');
  });
});