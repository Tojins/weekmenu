# Testing Strategy for Database-Dependent Features

## Current Problems with Mocking

1. **Database query syntax errors are not caught** - Mocks return success even when the actual query would fail
2. **Auth mocking hides real authentication issues** - Can't test real auth flows
3. **False positives** - Tests pass even when the feature is broken
4. **Time wasted** - Spent more time debugging why tests didn't catch the error than fixing the actual issue

## Recommended Solutions

### 1. Test Database Approach (Recommended)

Create a dedicated Supabase test project or use local Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Run migrations against local DB
supabase db push
```

Benefits:
- Real database queries are tested
- Catches syntax errors immediately  
- Can test RLS policies
- Fast and isolated

### 2. Integration Test Categories

```javascript
// tests/integration/shopping-list.spec.js
test.describe('Shopping List Integration', () => {
  test.use({ 
    // Use real database, minimal mocking
    baseURL: process.env.TEST_URL || 'http://localhost:5173'
  });
  
  test('real database query', async ({ page }) => {
    // Test against actual database
  });
});

// tests/unit/shopping-list.spec.js  
test.describe('Shopping List Unit', () => {
  // Mock everything for fast unit tests
});
```

### 3. Database Test Utilities

```javascript
// tests/helpers/db-test-utils.js
export async function createTestUser(supabase) {
  const { data: { user } } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123'
  });
  return user;
}

export async function createTestShoppingList(supabase, userId) {
  const { data } = await supabase
    .from('shopping_lists')
    .insert({ 
      name: 'Test List',
      subscription_id: userId 
    })
    .select()
    .single();
  return data;
}

export async function cleanupTestData(supabase, userId) {
  // Clean up in reverse order of foreign keys
  await supabase.from('shopping_list_items').delete().eq('created_by', userId);
  await supabase.from('shopping_lists').delete().eq('subscription_id', userId);
  // etc...
}
```

### 4. Environment-Specific Testing

```javascript
// playwright.config.js
export default defineConfig({
  projects: [
    {
      name: 'unit',
      testMatch: '**/unit/**/*.spec.js',
      use: { 
        // Full mocking for speed
        baseURL: 'http://localhost:5173' 
      }
    },
    {
      name: 'integration', 
      testMatch: '**/integration/**/*.spec.js',
      use: { 
        // Real database, minimal mocks
        baseURL: process.env.SUPABASE_TEST_URL || 'http://localhost:54321'
      }
    }
  ]
});
```

### 5. Specific Test for Database Queries

```javascript
// tests/db-queries.spec.js
test.describe('Database Query Syntax', () => {
  test('shopping list items query with recipes join', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { supabase } = window;
      
      // Test the exact query used in the component
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select(`
          *,
          products:product_id(*),
          recipe_id(*)
        `)
        .limit(1);
        
      return { data, error };
    });
    
    // This would have caught our error immediately!
    expect(result.error).toBeNull();
  });
});
```

### 6. CI/CD Integration

```yaml
# .github/workflows/test.yml
jobs:
  test:
    services:
      supabase:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - name: Run migrations
        run: |
          supabase db push --db-url postgresql://postgres:postgres@localhost:5432/postgres
          
      - name: Run integration tests
        run: npm run test:integration
```

## Recommendations

1. **Keep both test types**: 
   - Unit tests with mocks for fast feedback
   - Integration tests with real DB for catching real issues

2. **Test database queries separately**:
   - Create specific tests just for Supabase queries
   - Test the exact select statements used in components

3. **Use test fixtures**:
   - Create reusable test data setup/teardown
   - Ensure tests don't interfere with each other

4. **Document query patterns**:
   - Keep a list of working Supabase query patterns
   - Test new patterns before using in components

## Example Implementation

```javascript
// tests/integration/shopping-list-queries.spec.js
import { test, expect } from '@playwright/test';
import { setupTestDatabase, cleanupTestDatabase } from './helpers/test-db';

test.describe('Shopping List Database Queries', () => {
  let testData;
  
  test.beforeAll(async () => {
    testData = await setupTestDatabase();
  });
  
  test.afterAll(async () => {
    await cleanupTestDatabase(testData);
  });
  
  test('recipe join query works correctly', async ({ page }) => {
    // This would have caught our exact error!
    const result = await page.evaluate(async (listId) => {
      const { supabase } = window;
      return await supabase
        .from('shopping_list_items')
        .select('*, recipe_id(*)')
        .eq('shopping_list_id', listId);
    }, testData.shoppingListId);
    
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});
```

This approach would have caught the `column recipes_1.name does not exist` error immediately in a real test environment.