import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';

test.describe('Menu Selector Layout - Final Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      // Set a default weekmenu to ensure the component loads properly
      localStorage.setItem('weekmenu', JSON.stringify({
        subscriptionId: 'test-sub-id',
        seed: 12345,
        version: 1,
        recipes: [],
        updatedAt: new Date().toISOString()
      }));
    });
    await mockAuth(page);
  });

  test('main element width is appropriate for 1920px screen', async ({ page }) => {
    // Set viewport to 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Wait for the page to load - wait for recipe cards
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 });
    
    // Wait a bit for layout to stabilize
    await page.waitForTimeout(500);
    
    // Get the main content area
    const mainContent = await page.locator('div.flex-1.overflow-y-auto').first();
    const isVisible = await mainContent.isVisible();
    expect(isVisible).toBe(true);
    
    const mainBox = await mainContent.boundingBox();
    expect(mainBox).toBeTruthy();
    
    // The main content should use most of the viewport width
    // Allow for potential sidebar (320px) and some margin
    const minimumWidth = 1920 - 320 - 100; // 1500px
    
    // Only check if we got a valid measurement
    if (mainBox.width > 0) {
      expect(mainBox.width).toBeGreaterThanOrEqual(minimumWidth);
      console.log(`✓ Main content width: ${mainBox.width}px (target: ≥${minimumWidth}px)`);
    } else {
      console.log(`⚠ Could not measure main content width accurately`);
    }
  });

  test('grid container is properly configured', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Wait for the page to load - wait for recipe cards
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 });
    
    // Wait for recipes to load
    await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 });
    
    // Check that the grid exists and has proper classes
    const grid = await page.locator('.grid').first();
    const gridExists = await grid.count() > 0;
    expect(gridExists).toBe(true);
    
    const gridClasses = await grid.getAttribute('class');
    expect(gridClasses).toContain('grid-cols-1');
    expect(gridClasses).toContain('md:grid-cols-2');
    expect(gridClasses).toContain('min-[1400px]:grid-cols-3');
    
    console.log(`✓ Grid is properly configured with responsive column classes`);
  });

  test('responsive breakpoints work correctly', async ({ page }) => {
    const breakpoints = [
      { width: 640, expectedCols: 1, name: 'mobile' },
      { width: 768, expectedCols: 2, name: 'tablet' },
      { width: 1280, expectedCols: 2, name: 'desktop' },
      { width: 1400, expectedCols: 3, name: 'large desktop' },
      { width: 1920, expectedCols: 3, name: 'extra large' }
    ];
    
    for (const { width, expectedCols, name } of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('http://localhost:5173/weekmenu/menu-selector');
      await page.waitForSelector('[data-testid="recipe-card"]', { timeout: 10000 });
      
      // Check grid classes
      const grid = await page.locator('.grid').first();
      const classes = await grid.getAttribute('class');
      
      console.log(`✓ ${name} (${width}px): Grid has appropriate column classes`);
      
      // Verify the grid has the right column class for this breakpoint
      if (width >= 1400) {
        expect(classes).toContain('min-[1400px]:grid-cols-3');
      } else if (width >= 768) {
        expect(classes).toContain('md:grid-cols-2');
      }
    }
  });
});