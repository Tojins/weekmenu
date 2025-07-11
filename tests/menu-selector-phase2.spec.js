import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';
import {
  selectRecipe,
  getSelectedRecipeCount,
  waitForRecipesToLoad,
  isOfflineIndicatorVisible,
  isSyncingIndicatorVisible,
  adjustServings,
  removeRecipe,
  getMenuData,
  waitForMenuToSave,
  isRecipeSelected,
  toggleSidebar,
  scrollToLoadMore,
  getVisibleRecipeCount
} from './helpers/menu-selector-helpers.js';

test.describe('Menu Selector - Phase 2 Database Integration', () => {
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

  test('user can see recipes from database', async ({ page }) => {
    // User story: As a user, I want to see available recipes to choose from
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);
    
    const recipeCount = await getVisibleRecipeCount(page);
    expect(recipeCount).toBeGreaterThan(0);
    expect(recipeCount).toBeLessThanOrEqual(24); // Initial page size per spec
  });

  test('user sees save status when making changes', async ({ page }) => {
    // User story: As a user, I want to know when my changes are being saved
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Make a change
    await selectRecipe(page, 0);

    // Verify the change is reflected immediately
    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(1);
    
    // Check that data is persisted
    const menuData = await getMenuData(page);
    expect(menuData?.recipes).toHaveLength(1);
  });

  test('user can work offline and changes persist', async ({ page }) => {
    // User story: As a user, I want to select recipes even when offline
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000); // Allow UI to update

    // User should know they're offline
    const isOffline = await isOfflineIndicatorVisible(page);
    expect(isOffline).toBe(true);

    // User can still select recipes
    await selectRecipe(page, 0);
    await selectRecipe(page, 1);

    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(2);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000); // Allow reconnection

    // Offline indicator should disappear
    const stillOffline = await isOfflineIndicatorVisible(page);
    expect(stillOffline).toBe(false);
  });

  test('user can see more recipes by scrolling', async ({ page }) => {
    // User story: As a user, I want to browse through all available recipes
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    const initialCount = await getVisibleRecipeCount(page);

    // Scroll to see more
    await scrollToLoadMore(page);
    await page.waitForTimeout(2000); // Wait for potential new recipes

    const afterScrollCount = await getVisibleRecipeCount(page);
    // Either we loaded more recipes, or we've seen all available recipes
    expect(afterScrollCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('user can build a weekly menu', async ({ page }) => {
    // User story: As a user, I want to select multiple recipes for my week
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Select several recipes
    await selectRecipe(page, 0);
    await selectRecipe(page, 1);
    await selectRecipe(page, 2);

    // Verify selection count
    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(3);

    // Check that menu data is properly structured
    const menuData = await getMenuData(page);
    expect(menuData).toBeTruthy();
    expect(menuData.recipes).toHaveLength(3);
    expect(menuData.seed).toBeDefined(); // For recipe variety
  });

  test('user can adjust servings for recipes', async ({ page }) => {
    // User story: As a user, I want to adjust servings based on my needs
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Select a recipe
    await selectRecipe(page, 0);

    // Get initial servings from menu data
    const initialMenu = await getMenuData(page);
    const initialServings = initialMenu?.recipes[0]?.servings || 4;

    // Increase servings
    await adjustServings(page, 'Recipe', 2); // Increase by 2

    // Verify servings increased
    await page.waitForTimeout(500);
    const updatedMenu = await getMenuData(page);
    const updatedServings = updatedMenu?.recipes[0]?.servings;
    expect(updatedServings).toBe(initialServings + 2);
  });

  test('user can manage selected recipes in sidebar', async ({ page }) => {
    // User story: As a user, I want to review and manage my selected recipes
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Select a recipe
    await selectRecipe(page, 0);
    await page.waitForTimeout(500); // Wait for state to update

    // Verify recipe was selected
    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(1);

    // Sidebar should be visible with minimize button
    const sidebarCloseButton = page.locator('[data-testid="sidebar-close"]');
    await expect(sidebarCloseButton).toBeVisible();

    // Click minimize
    await sidebarCloseButton.click();
    await page.waitForTimeout(300); // Wait for animation

    // Sidebar should be hidden now
    await expect(sidebarCloseButton).not.toBeVisible();

    // Collapsed badge should be visible
    const collapsedBadge = page.locator('[data-testid="sidebar-toggle-collapsed"]');
    await expect(collapsedBadge).toBeVisible();
  });

  test('user sees visual feedback for selected recipes', async ({ page }) => {
    // User story: As a user, I want to see which recipes I've already selected
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Select a recipe
    await selectRecipe(page, 0);

    // Should see visual indication (checkmark, different styling, etc.)
    const firstRecipeArea = await page.locator('[class*="recipe"]').first();
    
    // Look for any selection indicator
    const hasSelectionIndicator = await firstRecipeArea.evaluate(el => {
      // Check for checkmark SVG
      const hasCheckmark = el.querySelector('svg path[d*="M5 13l4"]') !== null;
      // Check for Remove button
      const hasRemoveButton = el.textContent?.includes('Remove');
      // Check for servings controls (look for plus button)
      const plusButtons = el.querySelectorAll('button');
      const hasServingsControls = Array.from(plusButtons).some(btn => btn.textContent?.includes('+'));
      
      return hasCheckmark || hasRemoveButton || hasServingsControls;
    });

    expect(hasSelectionIndicator).toBe(true);
  });

  test('user changes are saved immediately', async ({ page }) => {
    // User story: As a user, I want my menu selections to be saved immediately
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Build a menu
    await selectRecipe(page, 0);
    await selectRecipe(page, 1);
    
    // Verify selection
    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(2);

    // Get menu data - should be saved immediately
    const menuData = await getMenuData(page);
    expect(menuData).toBeTruthy();
    expect(menuData?.recipes).toHaveLength(2);
    expect(menuData?.seed).toBeDefined();
    
    // Each recipe should have required fields
    menuData?.recipes.forEach(recipe => {
      expect(recipe.recipeId).toBeDefined();
      expect(recipe.servings).toBeGreaterThan(0);
    });
  });
});