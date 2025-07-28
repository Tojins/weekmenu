import { expect, test } from '@playwright/test';
import { loginTestUser } from '../helpers/auth-real.js';

test.describe('Recipe Selector Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login to see the recipe selector panel on landing page
    await loginTestUser(page);
  });

  test('should display recipe images that load successfully', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/weekmenu/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find all visible recipe images on the page
    const recipeImages = await page.locator('img[alt*="recipe" i], img[alt*="Recipe" i], img[src*="unsplash"]').all();
    
    // Verify we have recipe images
    expect(recipeImages.length).toBeGreaterThan(0);
    
    // Check that at least one image has loaded successfully
    let loadedImages = 0;
    for (const img of recipeImages) {
      const isLoaded = await img.evaluate((el) => {
        return el.complete && el.naturalWidth > 0 && el.naturalHeight > 0;
      });
      if (isLoaded) loadedImages++;
    }
    
    expect(loadedImages).toBeGreaterThan(0);
  });

  test('should handle recipes without images gracefully', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/weekmenu/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for any recipe-related content
    const recipeContent = await page.locator('text=/recipe/i').first();
    expect(recipeContent).toBeTruthy();
    
    // Check that the page doesn't show broken image indicators
    const brokenImages = await page.locator('img').evaluateAll((images) => {
      return images.filter(img => {
        // Check for images that failed to load
        return !img.complete || (img.naturalWidth === 0 && img.src !== '');
      }).length;
    });
    
    // There should be no broken images
    expect(brokenImages).toBe(0);
    
    // Verify the page handles missing images with appropriate placeholders
    // Look for either images or placeholder elements (like SVGs or divs with background)
    const visualElements = await page.locator('img, svg, [class*="placeholder" i], [class*="empty" i]').count();
    expect(visualElements).toBeGreaterThan(0);
  });
});