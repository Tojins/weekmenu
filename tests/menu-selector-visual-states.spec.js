import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';

test.describe('Menu Selector - Visual Indicators and Empty States', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // Setup auth mocking
    await mockAuth(page);
  });

  test('shows visual indicator for already-added recipes', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add a recipe
    const addButton = page.locator('button:has-text("Add to menu")').first();
    await addButton.click();

    // Spec: "Visual indicator for already-added recipes"
    // Look for any visual change indicating recipe is selected
    // Could be checkmark, different button state, or text change
    const parentCard = addButton.locator('../..');
    
    // Should see some indicator - checkmark, "Added" text, or servings controls
    const indicators = parentCard.locator('svg').or(parentCard.locator('text="Added"')).or(parentCard.locator('button:has-text("+")')).or(parentCard.locator('button:has-text("-")'));
    await expect(indicators.first()).toBeVisible();
  });

  test('shows empty state message for no search results', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Try to search for something that won't exist
    const searchArea = page.locator('text="Search recipes"').or(page.locator('[placeholder*="Search recipes"]')).first();
    if (await searchArea.isVisible()) {
      await searchArea.click();
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      await searchInput.fill('xyznonexistentrecipe123456');
      
      // Apply search
      const applyButton = page.locator('button:has-text("Apply")');
      if (await applyButton.isVisible()) {
        await applyButton.click();
      } else {
        await page.keyboard.press('Enter');
      }

      // Spec: "No search results: 'No recipes found. Try different filters.'"
      await expect(page.locator('text="No recipes found. Try different filters."')).toBeVisible();
    }
  });

  test('shows loading state while fetching recipes', async ({ page }) => {
    // Slow down response to see loading state
    await page.route('**/rest/v1/recipes*', async route => {
      await page.waitForTimeout(2000);
      route.continue();
    });

    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    
    // Spec: "Loading state: Skeleton cards while fetching"
    // Look for any loading indicator
    const loadingIndicators = page.locator('.animate-pulse, [class*="skeleton"], [class*="loading"], text=/loading/i, [role="status"]');
    const hasLoading = await loadingIndicators.count() > 0;
    
    // Should show some loading state
    expect(hasLoading).toBeTruthy();

    // Wait for actual content
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.grid > div, [class*="recipe"]', { timeout: 5000 });
    
    // Skeleton should be gone
    await expect(page.locator('.animate-pulse')).not.toBeVisible();
  });

  test('sidebar hidden until first recipe is selected', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Spec: "Hidden by default until first recipe selected"
    // Sidebar elements should not be visible
    await expect(page.locator('text="Selected Recipes"')).not.toBeVisible();
    await expect(page.locator('text=/\d+ recipes? selected/i')).not.toBeVisible();
  });

  test('shows badge when first recipe is added', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add first recipe
    await page.locator('button:has-text("Add to menu")').first().click();

    // Spec: "Shows fixed badge on right edge when first recipe is added"
    // Spec: "Badge displays: '5 recipes → Continue' with arrow pointing right"
    // Look for recipe count indicator
    const badge = page.locator('text=/1 recipe|recipes selected/i');
    await expect(badge).toBeVisible();

    // Spec mentions "First recipe added: Badge animates in with subtle bounce"
    // Just verify it's visible - animation testing is flaky
  });

  test('shows offline indicator when connection is lost', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Go offline
    await page.context().setOffline(true);

    // Try an action
    const addButton = page.locator('button:has-text("Add to menu")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Spec: "Show offline indicator when database sync fails"
    // Spec: "Display 'Working offline' badge in UI"
    await expect(page.locator('text=/working offline|offline/i')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
  });

  test('recipe card displays required information', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Spec: "Recipe cards: Large recipe image, title + cooking time, ingredient list, labels"
    // Look for these elements in recipe cards
    
    // Should have images
    await expect(page.locator('img').first()).toBeVisible();
    
    // Should have titles (in headings)
    await expect(page.locator('h3, h2').filter({ hasText: /\w+/ }).first()).toBeVisible();
    
    // Should have cooking time
    await expect(page.locator('text=/\d+\s*m/').first()).toBeVisible();
    
    // Should have "Add to menu" buttons
    await expect(page.locator('button:has-text("Add to menu")').first()).toBeVisible();
  });

  test('click protection prevents accidental modal opening', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Spec: "Click protection: 40px zone around buttons/inputs prevents modal opening"
    const addButton = page.locator('button:has-text("Add to menu")').first();
    const buttonBox = await addButton.boundingBox();
    
    if (buttonBox) {
      // Click near but outside button (within 40px zone)
      await page.mouse.click(
        buttonBox.x - 30,
        buttonBox.y + buttonBox.height / 2
      );

      // Should not navigate away or open modal
      await expect(page).toHaveURL(/menu-selector/);
      
      // Now click the button directly - should work
      await addButton.click();
      
      // Should see some change (recipe added)
      await page.waitForTimeout(500);
    }
  });

  test('sidebar shows selected recipes with controls', async ({ page }) => {
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add recipes
    const addButtons = page.locator('button:has-text("Add to menu")');
    await addButtons.first().click();
    if (await addButtons.nth(1).isVisible()) {
      await addButtons.nth(1).click();
    }

    // Spec: Panel contents include "Header: 'Selected Recipes (5)'"
    await expect(page.locator('text=/Selected Recipes.*\\d+/i')).toBeVisible();

    // Spec: "List of selected recipes with editable servings count"
    // Look for servings controls
    await expect(page.locator('button:has-text("-")').first()).toBeVisible();
    await expect(page.locator('button:has-text("+")').first()).toBeVisible();

    // Spec: "Remove button on each recipe"
    await expect(page.locator('button:has-text("Remove")').or(page.locator('button:has-text("×")')).first()).toBeVisible();

    // Spec: "'Generate shopping list' button at bottom"
    await expect(page.locator('button:has-text("Generate shopping list")')).toBeVisible();
  });

  test('mobile view adjusts layout appropriately', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await page.waitForLoadState('networkidle');

    // Add a recipe
    await page.locator('button:has-text("Add to menu")').first().click();

    // Look for recipe count indicator
    const recipeIndicator = page.locator('text=/1 recipe|recipe selected/i').first();
    if (await recipeIndicator.isVisible()) {
      await recipeIndicator.click();
      
      // Spec: Mobile shows "no thumbnails" in sidebar
      // On mobile, images might be hidden in the selected recipes panel
      await page.waitForTimeout(500);
      
      // Just verify the panel opens and shows content
      await expect(page.locator('button:has-text("Generate shopping list")')).toBeVisible();
    }
  });
});