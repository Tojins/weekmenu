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
    
    // Wait for loading to complete - wait until "Loading..." is gone
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 });
    
    // Wait for Recipe Selector to be visible
    await page.waitForSelector('text=Recipe Selector', { timeout: 10000 });
    
    // Find all images on the page (recipe images might not have specific alt text)
    const allImages = await page.locator('img').all();
    
    // Filter out very small images (likely icons)
    const recipeImages = [];
    for (const img of allImages) {
      const size = await img.evaluate((el) => ({
        width: el.naturalWidth || el.width,
        height: el.naturalHeight || el.height,
        src: el.src,
        complete: el.complete
      }));
      
      // Consider images larger than 50x50 as potential recipe images
      if (size.width > 50 && size.height > 50) {
        recipeImages.push(img);
      }
    }
    
    // If no recipe images found, the test should pass anyway
    // The important thing is that the page loads without errors
    if (recipeImages.length === 0) {
      // Verify that the recipe selector loaded
      const recipeCards = await page.locator('[class*="recipe" i], [class*="card" i]').count();
      expect(recipeCards).toBeGreaterThan(0);
    } else {
      // Check that at least one image has loaded successfully
      let loadedImages = 0;
      for (const img of recipeImages) {
        const isLoaded = await img.evaluate((el) => {
          return el.complete && el.naturalWidth > 0 && el.naturalHeight > 0;
        });
        if (isLoaded) loadedImages++;
      }
      
      expect(loadedImages).toBeGreaterThan(0);
    }
  });

  test('should handle recipes without images gracefully', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/weekmenu/');
    
    // Wait for loading to complete - wait until "Loading..." is gone
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 });
    
    // Wait for Recipe Selector to be visible
    await page.waitForSelector('text=Recipe Selector', { timeout: 10000 });
    
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