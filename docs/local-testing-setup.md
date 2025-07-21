# Local Testing Setup with Real Database

This setup uses local Supabase with Docker to run tests against a real database, avoiding the pitfalls of mocking.

## Prerequisites

- Docker Desktop with WSL integration enabled
- Node.js and npm installed

## Quick Start

```bash
# 1. Start local Supabase (requires Docker)
npm run supabase:start

# 2. Reset database and apply seed data
npm run db:reset

# 3. Run tests against local database
npm run test:local

# 4. Stop Supabase when done
npm run supabase:stop
```

## What This Setup Provides

### 1. Test Users
Pre-configured test users that always exist:
- `test@example.com` / `testpassword123`
- `test2@example.com` / `testpassword123`

### 2. Seed Data
- Store chains and stores
- Product categories
- Sample products
- Test recipes
- Shopping lists with items (including recipe references)

### 3. Real Authentication
No auth mocking - tests use actual Supabase Auth with test users.

### 4. Real Database Queries
All queries execute against PostgreSQL, catching syntax errors immediately.

## Test Structure

```
tests/
├── helpers/
│   ├── auth-mock.js       # Old mocking approach (kept for comparison)
│   └── auth-real.js       # Real auth helper using test users
└── local-db/
    └── shopping-list-real.spec.js  # Example test using real DB
```

## Writing Tests

```javascript
import { test, expect } from '@playwright/test';
import { loginTestUser } from '../helpers/auth-real.js';

test('real database test', async ({ page }) => {
  // Login with test user
  await loginTestUser(page, 1);
  
  // Navigate and test - no mocking needed!
  await page.goto('/shopping-list/list-001');
  
  // Assertions work against real data
  await expect(page.getByText('Test Apple')).toBeVisible();
});
```

## Benefits

1. **Catches Real Errors**: Would have caught `column recipes_1.name does not exist` immediately
2. **Tests RLS Policies**: Real row-level security is enforced
3. **No Mock Maintenance**: Don't need to update mocks when queries change
4. **Confidence**: Tests pass = it works in production

## Running Specific Tests

```bash
# Run all local DB tests
npm run test:local

# Run with UI mode for debugging
npm run test:local:ui

# Run specific test file
npm run test:local tests/local-db/shopping-list-real.spec.js
```

## Troubleshooting

### Port Conflicts
If you get "port already in use" errors:
```bash
npm run supabase:stop
docker ps -a  # Check for lingering containers
docker stop $(docker ps -q)  # Stop all containers
npm run supabase:start
```

### Database State
To reset to clean state:
```bash
npm run db:reset  # Drops everything and re-seeds
```

### View Database
Access Supabase Studio at http://localhost:54323 to inspect data.

## Environment Variables

The `.env.test` file contains:
- Local Supabase URLs
- Test user credentials
- Standard local development keys (safe to commit)

## Best Practices

1. **Keep Both Test Types**:
   - Unit tests with mocks for speed
   - Integration tests with real DB for accuracy

2. **Test Categories**:
   ```javascript
   // Fast unit test (mocked)
   test.describe('Component Logic', () => {
     // Mock everything
   });
   
   // Integration test (real DB)
   test.describe('Database Queries', () => {
     // Use real Supabase
   });
   ```

3. **Clean State**: Each test should clean up after itself or use unique data.

## Example: Testing the Recipe Join Fix

This test would have caught the error immediately:

```javascript
test('recipe join query', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { supabase } = window;
    
    // The exact query from the component
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select('*, recipe_id(*)')
      .limit(1);
      
    return { data, error };
  });
  
  // This would fail with "column recipes_1.name does not exist"
  expect(result.error).toBeNull();
});
```

## Summary

This approach provides:
- ✅ Real database queries
- ✅ Real authentication
- ✅ Predictable test data
- ✅ Fast feedback on query errors
- ✅ Confidence that tests reflect production behavior