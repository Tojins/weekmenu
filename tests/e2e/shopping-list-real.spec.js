import { test, expect } from '@playwright/test';
import { loginTestUser, ensureLoggedOut } from '../helpers/auth-real.js';

test.describe('Shopping List with Real Database', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('shopping list database queries work correctly', async ({ page }) => {
    // Login with real test user
    await loginTestUser(page, 1);
    
    // Go to home page where we can run queries
    await page.goto('/weekmenu/');
    
    // Wait for page to load
    await page.waitForSelector('text=Shopping Lists');
    
    // Test the shopping list items query directly
    const queryResult = await page.evaluate(async () => {
      const { supabase } = window;
      
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          product:products(
            name,
            quantity,
            unit,
            unit_price
          ),
          recipe:recipes(title)
        `)
        .eq('shopping_list_id', '00000000-0000-0000-0000-000000000701')
        .order('display_order', { ascending: true });
        
      return { data, error, hasData: data && data.length > 0 };
    });
    
    // Verify query succeeded (even if no data)
    expect(queryResult.error).toBeNull();
    // Data might be empty if shopping list items aren't seeded
    expect(queryResult.data).toBeDefined();
  });

  test('recipe join query works correctly', async ({ page }) => {
    await loginTestUser(page, 1);
    
    await page.goto('/weekmenu/');
    await page.waitForSelector('text=Shopping Lists');
    
    // Test the exact query with recipe joins
    const result = await page.evaluate(async () => {
      const { supabase } = window;
      
      // This is the query that tests the join functionality
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          product:product_id(
            name,
            quantity,
            unit,
            unit_price,
            store_categories:store_category_id(category_name)
          ),
          recipe_id(*)
        `)
        .eq('shopping_list_id', '00000000-0000-0000-0000-000000000701')
        .order('display_order', { ascending: true });
        
      return { data, error, hasError: !!error };
    });
    
    // Should not have any errors
    expect(result.hasError).toBe(false);
    expect(result.error).toBeNull();
    
    // Should have data
    expect(result.data).toBeDefined();
    if (result.data && result.data.length > 0) {
      // Check structure of joined data
      const firstItem = result.data[0];
      expect(firstItem).toHaveProperty('product');
      
      // If there's a recipe_id, it should be expanded
      if (firstItem.recipe_id) {
        expect(typeof firstItem.recipe_id).toBe('object');
      }
    }
  });
});