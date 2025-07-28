import { expect, test } from '@playwright/test';
import { loginTestUser } from '../helpers/auth-real.js';

test.describe('Week Menu to Shopping List', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
    
    // Clear any existing weekmenu
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Note: Shopping lists persist between tests and may cause conflicts
    // The modal should handle existing lists appropriately
  });

  test('should add a week menu with recipes to shopping list', async ({ page }) => {
    
    // Navigate to home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to recipe selection
    await page.getByRole('button', { name: /recipe selector/i }).click();
    
    // Check if any recipes need to be added
    const addButtons = page.getByRole('button', { name: 'Add to menu' });
    const addButtonCount = await addButtons.count();
    
    if (addButtonCount === 0) {
      // All recipes are already in menu, proceed to shopping list
    } else {
      // Add a recipe to the menu
      await addButtons.first().click();
    }
    
    // Wait for the recipe to be added and sidebar to appear
    await page.waitForTimeout(1000);
    
    // Look for the shopping list button in the sidebar
    // The sidebar appears when recipes are added
    const generateButton = page.getByRole('button', { name: /generate shopping list/i });
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    
    // Modal should appear for adding to shopping list
    await expect(page.getByRole('heading', { name: /add.*shopping list/i })).toBeVisible();
    
    // Review ingredients section should be visible
    await expect(page.getByText(/review ingredients/i)).toBeVisible();
    
    // Wait for ingredients to load
    await page.waitForTimeout(1000);
    
    // Since user has default store, the modal should default to creating a new list with that store
    // Verify the create new list option is selected
    const createNewRadio = page.getByRole('radio', { name: /create new list/i });
    await expect(createNewRadio).toBeChecked();
    
    // Check if store dropdown exists and shows the default store
    const storeDropdown = page.locator('select').first();
    const storeDropdownCount = await storeDropdown.count();
    
    if (storeDropdownCount > 0) {
      const selectedStore = await storeDropdown.inputValue();
      
      // If no store is selected, select the first available store
      if (!selectedStore || selectedStore === '') {
        await storeDropdown.selectOption({ index: 1 }); // Skip "Select store (optional)"
      }
    }
    
    // Submit the form
    await page.getByRole('button', { name: /add to shopping list/i }).last().click();
    
    
    // Verify navigation to shopping list
    await page.waitForURL(/shopping-list/, { timeout: 5000 });
    
    // Verify we're on a shopping list page - it shows the store name as heading
    const storeHeading = page.getByRole('heading', { level: 1 });
    await expect(storeHeading).toBeVisible();
    
    // Verify we have shopping list items
    await expect(page.getByRole('spinbutton').first()).toBeVisible();
  });
  
  test('should allow same product with different units when adding recipes to shopping list', async ({ page }) => {
    // This test verifies that the same product can appear multiple times
    // in a shopping list if it has different units (e.g., "2 lemons" vs "100g lemon juice")
    
    // Navigate to home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Clear any existing weekmenu
    const removeButtons = await page.getByRole('button', { name: 'Remove from menu' }).all();
    for (let i = removeButtons.length - 1; i >= 0; i--) {
      await removeButtons[i].click();
      await page.waitForTimeout(300);
    }
    
    // Navigate to recipe selection
    await page.getByRole('button', { name: /recipe selector/i }).click();
    
    // Add multiple recipes
    const addButtons = page.getByRole('button', { name: 'Add to menu' });
    const buttonCount = await addButtons.count();
    const recipesToAdd = Math.min(buttonCount, 3);
    
    for (let i = 0; i < recipesToAdd; i++) {
      await page.getByRole('button', { name: 'Add to menu' }).first().click();
      await page.waitForTimeout(500);
    }
    
    // Generate shopping list
    const generateButton = page.getByRole('button', { name: /generate shopping list/i });
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    
    // Wait for modal
    await expect(page.getByRole('heading', { name: /add.*shopping list/i })).toBeVisible();
    await page.waitForTimeout(1000);
    
    // Create new list to ensure clean state
    await page.getByRole('radio', { name: /create new list/i }).click();
    
    // Submit to create shopping list
    await page.getByRole('button', { name: /add to shopping list/i }).last().click();
    
    // Wait for navigation to shopping list
    await page.waitForURL(/shopping-list/, { timeout: 5000 });
    
    // Verify we're on a shopping list page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check shopping list items
    const items = await page.locator('[data-testid="shopping-list-item"]').all();
    const itemDetails = [];
    
    for (const item of items) {
      const productName = await item.locator('[data-testid="product-name"]').textContent();
      const quantity = await item.locator('input[type="number"]').inputValue();
      
      let unit;
      const unitSelect = item.locator('select[data-testid="unit"]');
      const unitSpan = item.locator('span[data-testid="unit"]');
      
      if (await unitSelect.count() > 0) {
        unit = await unitSelect.inputValue();
      } else if (await unitSpan.count() > 0) {
        unit = await unitSpan.textContent();
      }
      
      itemDetails.push({
        productName: productName.trim(),
        quantity: parseFloat(quantity),
        unit: unit.trim()
      });
    }
    
    // Check for items with same product name but different units
    const productGroups = {};
    itemDetails.forEach(item => {
      if (!productGroups[item.productName]) {
        productGroups[item.productName] = [];
      }
      productGroups[item.productName].push(item);
    });
    
    // Log for debugging
    console.log('Shopping list items grouped by product:', productGroups);
    
    // Verify that if same product appears multiple times, they have different units
    for (const [productName, items] of Object.entries(productGroups)) {
      if (items.length > 1) {
        const units = items.map(item => item.unit);
        const uniqueUnits = [...new Set(units)];
        
        // If same product appears multiple times, units should be different
        // (Otherwise they should have been merged)
        expect(uniqueUnits.length).toBe(units.length);
        console.log(`Product "${productName}" appears ${items.length} times with units: ${units.join(', ')}`);
      }
    }
    
    // Verify we have items in the list
    expect(items.length).toBeGreaterThan(0);
  });
  
  test('should handle multiple recipes in week menu', async ({ page }) => {
    // Navigate to home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to recipe selection
    await page.getByRole('button', { name: /recipe selector/i }).click();
    
    // Add multiple recipes if not already added
    const addButtons = page.getByRole('button', { name: 'Add to menu' });
    const buttonCount = await addButtons.count();
    const recipesToAdd = Math.min(buttonCount, 3);
    
    for (let i = 0; i < recipesToAdd; i++) {
      // Always click the first "Add to menu" button as they disappear after clicking
      await page.getByRole('button', { name: 'Add to menu' }).first().click();
      await page.waitForTimeout(500);
    }
    
    // Wait for sidebar with shopping list button
    const generateButton = page.getByRole('button', { name: /generate shopping list/i });
    await expect(generateButton).toBeVisible({ timeout: 5000 });
    await generateButton.click();
    
    // Verify modal appears
    await expect(page.getByRole('heading', { name: /add.*shopping list/i })).toBeVisible();
    
    // Wait a bit for ingredients to load
    await page.waitForTimeout(1000);
    
    // Check if there are any ingredients displayed
    const ingredientSections = await page.locator('.border.border-gray-200.rounded-lg.p-4').count();
    
    // If no ingredients, check for empty state or error
    if (ingredientSections === 0) {
      const pageContent = await page.textContent('body');
      console.log('Modal content includes:', pageContent.includes('Review Ingredients'));
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-no-ingredients.png' });
    }
    
    // Verify multiple recipes are represented
    const recipeReferences = page.getByText(/from/i);
    const refCount = await recipeReferences.count();
    expect(refCount).toBeGreaterThanOrEqual(recipesToAdd);
    
    // Check if we have an existing list option
    const addToExistingRadio = page.getByRole('radio', { name: /add to existing list/i });
    const hasExistingList = await addToExistingRadio.count() > 0;
    
    if (hasExistingList) {
      // Select existing list option
      await addToExistingRadio.click();
      
      // Wait for dropdown to appear and ensure a list is selected
      const listDropdown = page.locator('select.ml-6');
      await expect(listDropdown).toBeVisible();
      
      // The dropdown should already have a value selected, but make sure
      const currentValue = await listDropdown.inputValue();
      if (!currentValue) {
        // Select the first available option
        const firstOption = await listDropdown.locator('option').nth(0).getAttribute('value');
        if (firstOption) {
          await listDropdown.selectOption(firstOption);
        }
      }
    } else {
      // Handle custom buttons if any ingredients need matching
      const customButtons = page.getByRole('button', { name: /custom/i });
      const customButtonCount = await customButtons.count();
      
      for (let i = 0; i < customButtonCount; i++) {
        await customButtons.nth(i).click();
        await page.waitForTimeout(200);
      }
    }
    
    // Submit the form
    await page.getByRole('button', { name: /add to shopping list/i }).last().click();
    
    // Verify successful creation
    await page.waitForURL(/shopping-list/, { timeout: 5000 });
    
    // Verify we're on a shopping list page
    const storeHeading = page.getByRole('heading', { level: 1 });
    await expect(storeHeading).toBeVisible();
    
    // Verify we have shopping list items from multiple recipes
    const spinButtons = page.getByRole('spinbutton');
    await expect(spinButtons.first()).toBeVisible();
    const itemCount = await spinButtons.count();
    expect(itemCount).toBeGreaterThan(recipesToAdd);
  });

  test('should prevent duplicate products when manually adding items', async ({ page }) => {
    // This test verifies that manually adding items prevents duplicates
    // by updating quantity instead of creating a new item
    
    // Navigate to home page
    await page.goto('/weekmenu/');
    await page.waitForLoadState('networkidle');
    
    // Find or create a shopping list
    // Try to navigate to an existing shopping list or create a new one
    const shoppingListLinks = page.locator('a[href*="/shopping-list/"]');
    const listCount = await shoppingListLinks.count();
    
    if (listCount > 0) {
      // Use existing list
      await shoppingListLinks.first().click();
    } else {
      // Create a new shopping list by adding a recipe
      await page.getByRole('button', { name: /recipe selector/i }).click();
      
      const addButtons = page.getByRole('button', { name: 'Add to menu' });
      if (await addButtons.count() > 0) {
        await addButtons.first().click();
        await page.waitForTimeout(500);
        
        const generateButton = page.getByRole('button', { name: /generate shopping list/i });
        await expect(generateButton).toBeVisible({ timeout: 5000 });
        await generateButton.click();
        
        await expect(page.getByRole('heading', { name: /add.*shopping list/i })).toBeVisible();
        await page.getByRole('radio', { name: /create new list/i }).click();
        await page.getByRole('button', { name: /add to shopping list/i }).last().click();
      }
    }
    
    // Wait for shopping list page
    await page.waitForURL(/shopping-list/, { timeout: 5000 });
    
    // Search for a product to add
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    // If search results appear, add the first product
    const addButton = page.getByRole('button', { name: 'Add' }).first();
    if (await addButton.count() > 0) {
      // Get the initial item count
      const initialItems = await page.locator('[data-testid="shopping-list-item"]').count();
      
      // Add the product once
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Clear search to reset
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      // Search for the same product again
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Try to add the same product again
      const addButtonAgain = page.getByRole('button', { name: 'Add' }).first();
      if (await addButtonAgain.count() > 0) {
        await addButtonAgain.click();
        await page.waitForTimeout(500);
      }
      
      // Verify that the item count hasn't increased (duplicate was prevented)
      const finalItems = await page.locator('[data-testid="shopping-list-item"]').count();
      expect(finalItems).toBe(initialItems + 1); // Only one item should have been added
      
      // Verify the quantity was updated instead
      const quantities = await page.locator('input[type="number"]').all();
      let foundQuantityGreaterThanOne = false;
      for (const quantityInput of quantities) {
        const value = await quantityInput.inputValue();
        if (parseFloat(value) > 1) {
          foundQuantityGreaterThanOne = true;
          break;
        }
      }
      
      // If we successfully added the same item twice, quantity should be > 1
      if (await addButtonAgain.count() > 0) {
        expect(foundQuantityGreaterThanOne).toBe(true);
      }
    }
    
    // Test custom items
    const customButton = page.getByRole('button', { name: /add custom item/i });
    if (await customButton.count() > 0) {
      await customButton.click();
      
      const customInput = page.getByPlaceholder('Enter item name...');
      await customInput.fill('Custom Test Item');
      await page.getByRole('button', { name: 'Add' }).last().click();
      await page.waitForTimeout(500);
      
      // Try to add the same custom item again
      await customButton.click();
      await customInput.fill('Custom Test Item');
      const customItemsBefore = await page.locator('[data-testid="shopping-list-item"]').count();
      await page.getByRole('button', { name: 'Add' }).last().click();
      await page.waitForTimeout(500);
      
      // Verify no duplicate was created
      const customItemsAfter = await page.locator('[data-testid="shopping-list-item"]').count();
      expect(customItemsAfter).toBe(customItemsBefore); // No new item should be added
    }
  });
});