import { test, expect } from '@playwright/test';
import { loginTestUser, ensureLoggedOut } from '../helpers/auth-real.js';

test.describe('Shopping List with Real Database', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('shopping list query works without mocking', async ({ page }) => {
    // Login with real test user
    const user = await loginTestUser(page, 1);
    
    // Navigate to the seeded shopping list
    await page.goto('/shopping-list/list-001');
    
    // Wait for the list to load
    await page.waitForSelector('h1');
    
    // Check that the list loaded correctly
    await expect(page.locator('h1')).toContainText('Test Store 1');
    
    // Check that items are displayed (from seed data)
    await expect(page.getByText('Test Apple')).toBeVisible();
    await expect(page.getByText('Test Milk')).toBeVisible();
    await expect(page.getByText('Test Banana')).toBeVisible();
    
    // Check that recipe info is shown
    await expect(page.getByText('From Test Recipe 1')).toBeVisible();
    
    // No errors should occur
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit to ensure no errors
    await page.waitForTimeout(1000);
    
    // Check no database errors occurred
    const hasDbError = consoleErrors.some(error => 
      error.includes('column') || error.includes('42703')
    );
    expect(hasDbError).toBe(false);
  });

  test('can create new shopping list item', async ({ page }) => {
    await loginTestUser(page, 1);
    
    await page.goto('/shopping-list/list-001');
    
    // Search for a product
    await page.fill('input[placeholder="Search products..."]', 'Bread');
    await page.waitForTimeout(500); // Wait for search
    
    // Click add on the bread product
    await page.click('button:has-text("Add")');
    
    // Verify the item was added
    await expect(page.getByText('Test Bread')).toBeVisible();
  });

  test('recipe join query specifically', async ({ page }) => {
    await loginTestUser(page, 1);
    
    // Test the exact query that was failing
    const result = await page.evaluate(async () => {
      const { supabase } = window;
      
      // This is the query that should work now
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          products:product_id(
            *,
            store_categories:store_category_id(category_name)
          ),
          recipe_id(*)
        `)
        .eq('shopping_list_id', 'list-001')
        .order('display_order', { ascending: true });
        
      return { data, error, hasError: !!error };
    });
    
    // Should not have any errors
    expect(result.hasError).toBe(false);
    expect(result.error).toBeNull();
    
    // Should have data
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
    
    // Check structure
    const itemWithRecipe = result.data.find(item => item.recipe_id);
    expect(itemWithRecipe).toBeDefined();
    expect(itemWithRecipe.recipe_id).toHaveProperty('name');
    expect(itemWithRecipe.products).toHaveProperty('name');
  });
});