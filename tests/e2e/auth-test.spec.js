import { test, expect } from '@playwright/test';

test.describe('Auth Test', () => {
  test('can login with test user', async ({ page }) => {
    // Set a reasonable timeout for the whole test
    test.setTimeout(30000); // 30 seconds total
    
    // Navigate to login page
    await page.goto('/weekmenu/login');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    // Click sign in and wait for either success or error
    await Promise.all([
      page.waitForURL('**/weekmenu/', { timeout: 5000 }).catch(() => null),
      page.click('button:has-text("Sign In")')
    ]);
    
    // Check if we're on the home page
    const currentUrl = page.url();
    if (currentUrl.includes('/weekmenu/login')) {
      // Still on login page - check for error message
      const errorMessage = await page.textContent('text=Invalid login credentials').catch(() => null);
      if (errorMessage) {
        throw new Error('Login failed: Invalid credentials');
      }
      throw new Error('Login failed: Still on login page');
    }
    
    // Verify we're logged in by checking localStorage
    const authData = await page.evaluate(() => {
      // Supabase v2 uses a different localStorage structure
      const keys = Object.keys(localStorage);
      const authKey = keys.find(key => key.includes('supabase.auth.token') || key.includes('sb-') && key.includes('-auth-token'));
      if (authKey) {
        return localStorage.getItem(authKey);
      }
      // Check for any auth-related keys
      const authKeys = keys.filter(key => key.includes('auth') || key.includes('sb-'));
      return authKeys.length > 0 ? authKeys : null;
    });
    
    console.log('Auth data found:', authData);
    expect(authData).toBeTruthy();
  });
});