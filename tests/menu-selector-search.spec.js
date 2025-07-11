import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';
import { waitForRecipesToLoad } from './helpers/menu-selector-helpers.js';

test.describe('Menu Selector - Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    // Setup auth mocking FIRST
    await mockAuth(page);
    
    // Then clear other localStorage items while preserving auth
    await page.addInitScript(() => {
      const authToken = localStorage.getItem('sb-padeskjkdetesmfuicvm-auth-token');
      localStorage.clear();
      if (authToken) {
        localStorage.setItem('sb-padeskjkdetesmfuicvm-auth-token', authToken);
      }
    });
  });

  test('compact search bar expands on click', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Look for search functionality as described in spec:
    // "Search icon + 'Search recipes...' placeholder (expands on click)"
    const searchArea = page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).or(page.locator('button:has-text("Search")')).first();
    
    // Click to expand search panel
    await searchArea.click();
    
    // According to spec, expanded panel should show:
    // "Apply" and "Clear all" buttons
    await expect(page.locator('button:has-text("Apply")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear all")')).toBeVisible();
  });

  test('recent searches dropdown shows previous searches', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Expand search panel
    const searchArea = page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).first();
    await searchArea.click();

    // Type and apply a search
    const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
    await searchInput.fill('pasta');
    await page.locator('button:has-text("Apply")').click();

    // Do another search
    await searchArea.click();
    await searchInput.fill('salad');
    await page.locator('button:has-text("Apply")').click();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Expand search panel again
    await page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).first().click();

    // Spec says: "Recent searches dropdown (stored in localStorage with 30-day expiry)"
    // Should see previous searches somewhere in the UI
    await expect(page.locator('text="pasta"').or(page.locator('text="salad"'))).toBeVisible();
  });

  test('filter icon shows badge with active filter count', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Spec: "Filter icon with badge showing active filter count"
    // Click filter to expand panel
    const filterArea = page.locator('text="Filter"').or(page.locator('button:has-text("Filter")')).first();
    await filterArea.click();

    // Spec mentions "Filter pills: cooking time, ingredients, seasonal"
    // Select some filters
    const filterOptions = page.locator('button, label').filter({ hasText: /cooking time|ingredients|seasonal/i });
    await filterOptions.first().click();
    
    // Try to find another filter option
    const secondFilter = filterOptions.nth(1);
    if (await secondFilter.isVisible()) {
      await secondFilter.click();
    }
    
    // Apply filters
    await page.locator('button:has-text("Apply")').click();

    // Filter icon should show badge with count
    await expect(page.locator('text=/\d+/').near(page.locator('text="Filter"'))).toBeVisible();
  });

  test('clear all button resets search and filters', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Expand search/filter panel
    const searchArea = page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).first();
    await searchArea.click();

    // Enter search text
    const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
    await searchInput.fill('test search');
    
    // Spec: "'Clear all' buttons" in expanded panel
    await page.locator('button:has-text("Clear all")').click();

    // Search should be cleared
    await expect(searchInput).toHaveValue('');
  });

  test('click outside or X closes expanded search panel', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Expand search panel
    const searchArea = page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).first();
    await searchArea.click();
    
    // Panel should be expanded
    await expect(page.locator('button:has-text("Apply")')).toBeVisible();

    // Spec: "Click outside or 'X' to collapse"
    // Try clicking outside first
    await page.mouse.click(10, 10);

    // Panel should collapse
    await expect(page.locator('button:has-text("Apply")')).not.toBeVisible();
  });

  test('recent searches respect 30-day expiry', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Spec: "Recent searches dropdown (stored in localStorage with 30-day expiry)"
    // Set up old and new searches
    await page.evaluate(() => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31); // 31 days ago
      
      const searches = [
        { query: 'very old search', timestamp: oldDate.toISOString() },
        { query: 'recent search', timestamp: new Date().toISOString() }
      ];
      
      localStorage.setItem('recentSearches', JSON.stringify(searches));
    });

    await page.waitForLoadState('networkidle');

    // Expand search panel to see recent searches
    const searchArea = page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).first();
    await searchArea.click();

    // Should only see recent search, not the old one
    await expect(page.locator('text="recent search"')).toBeVisible();
    await expect(page.locator('text="very old search"')).not.toBeVisible();
  });
});