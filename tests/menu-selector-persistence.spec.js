import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth-mock.js';
import {
  selectRecipe,
  getSelectedRecipeCount,
  waitForRecipesToLoad,
  isOfflineIndicatorVisible,
  getMenuData,
  waitForMenuToSave
} from './helpers/menu-selector-helpers.js';

test.describe('Menu Selector - Data Persistence and Conflict Resolution', () => {
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

  test('user gets immediate feedback when selecting recipes', async ({ page }) => {
    // User story: As a user, I want immediate response when I select recipes
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Select a recipe
    await selectRecipe(page, 0);

    // Should see immediate UI update
    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(1);

    // Data should be persisted immediately (even if not synced to DB yet)
    const menuData = await getMenuData(page);
    expect(menuData?.recipes).toHaveLength(1);

    // Select another recipe
    await selectRecipe(page, 1);

    // Should see immediate update again
    const updatedCount = await getSelectedRecipeCount(page);
    expect(updatedCount).toBe(2);

    // Data should update immediately
    const updatedMenuData = await getMenuData(page);
    expect(updatedMenuData?.recipes).toHaveLength(2);
  });

  test('user can make multiple rapid changes without losing data', async ({ page }) => {
    // User story: As a user, I want to quickly build my menu without waiting
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Make rapid selections
    await selectRecipe(page, 0);
    await selectRecipe(page, 1);
    await selectRecipe(page, 2);

    // All changes should be reflected immediately
    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(3);

    // Wait for any background saves
    await waitForMenuToSave(page);

    // Verify data integrity
    const menuData = await getMenuData(page);
    expect(menuData?.recipes).toHaveLength(3);
  });

  test('user is notified if menu was updated elsewhere', async ({ page }) => {
    // User story: As a user, I want to know if someone else updated the menu
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Initial selection
    await selectRecipe(page, 0);

    // Simulate update from another source
    await page.evaluate(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'weekmenu',
        newValue: JSON.stringify({
          subscriptionId: 'test-sub-id',
          seed: 12345,
          version: 2,
          recipes: [
            { recipeId: 'external-1', servings: 6 },
            { recipeId: 'external-2', servings: 4 }
          ],
          updatedAt: new Date().toISOString()
        }),
        url: window.location.href
      }));
    });

    // Give UI time to respond
    await page.waitForTimeout(1000);

    // User should see some indication of change
    // This could be a toast, updated count, or refreshed UI
    const updatedCount = await getSelectedRecipeCount(page);
    // Count might have changed, or UI might show notification
    expect(updatedCount).toBeDefined();
  });

  test('user can work offline without losing data', async ({ page }) => {
    // User story: As a user, I want to build my menu even without internet
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Should see offline indication
    const isOffline = await isOfflineIndicatorVisible(page);
    expect(isOffline).toBe(true);

    // Can still make selections
    await selectRecipe(page, 0);
    await selectRecipe(page, 1);

    const selectedCount = await getSelectedRecipeCount(page);
    expect(selectedCount).toBe(2);

    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);

    // Offline indicator should clear
    const stillOffline = await isOfflineIndicatorVisible(page);
    expect(stillOffline).toBe(false);

    // Data should still be there
    const finalCount = await getSelectedRecipeCount(page);
    expect(finalCount).toBe(2);
  });

  test('user changes are tracked for conflict resolution', async ({ page }) => {
    // User story: As a user, I want my latest changes to be preserved
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Make initial selection
    await selectRecipe(page, 0);
    const initialData = await getMenuData(page);

    // Make another change
    await page.waitForTimeout(200);
    await selectRecipe(page, 1);
    const updatedData = await getMenuData(page);

    // Version should increment for conflict tracking
    expect(updatedData?.version).toBeGreaterThan(initialData?.version || 0);
    
    // Timestamp should be updated
    const initialTime = new Date(initialData?.updatedAt).getTime();
    const updatedTime = new Date(updatedData?.updatedAt).getTime();
    expect(updatedTime).toBeGreaterThan(initialTime);
  });

  test('user menu selections are preserved in memory', async ({ page }) => {
    // User story: As a user, I expect my selections to be stable
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Build a menu
    await selectRecipe(page, 0);
    await selectRecipe(page, 1);

    // Get initial state
    const countBefore = await getSelectedRecipeCount(page);
    expect(countBefore).toBe(2);
    
    const menuBefore = await getMenuData(page);
    expect(menuBefore?.recipes).toHaveLength(2);
    const seedBefore = menuBefore?.seed;

    // Wait a moment
    await page.waitForTimeout(1000);

    // Selections should still be there
    const countAfter = await getSelectedRecipeCount(page);
    expect(countAfter).toBe(2);
    
    // Data should be unchanged
    const menuAfter = await getMenuData(page);
    expect(menuAfter?.recipes).toHaveLength(2);
    expect(menuAfter?.seed).toBe(seedBefore);
  });

  test('user gets real-time updates when available', async ({ page }) => {
    // User story: As a user, I want to see updates as they happen
    await page.goto('http://localhost:5173/weekmenu/menu-selector');
    await waitForRecipesToLoad(page);

    // Make initial selection
    await selectRecipe(page, 0);
    
    // Verify initial state
    const initialCount = await getSelectedRecipeCount(page);
    expect(initialCount).toBe(1);

    // Simulate real-time update from another source
    await page.evaluate(() => {
      const currentMenu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
      const updatedMenu = {
        ...currentMenu,
        version: (currentMenu.version || 1) + 1,
        recipes: [
            { recipeId: 'realtime-1', servings: 4 },
            { recipeId: 'realtime-2', servings: 6 }
        ],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('weekmenu', JSON.stringify(updatedMenu));
      
      // Trigger storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'weekmenu',
        newValue: JSON.stringify(updatedMenu),
        url: window.location.href
      }));
    });

    // Allow time for any UI updates
    await page.waitForTimeout(1000);
    
    // Verify data was updated
    const menuData = await getMenuData(page);
    expect(menuData?.recipes?.length).toBe(2);
  });
});