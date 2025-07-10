import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('app loads and shows login page', async ({ page }) => {
    await page.goto('/');
    
    // Should see login page elements
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Welcome back'))).toBeVisible({ timeout: 10000 });
    
    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for Google sign in button
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('navigation structure exists', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to menu-selector (should redirect to login)
    await page.goto('/menu-selector');
    
    // Should be redirected back to login
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('localStorage works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Set test data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('test-key', 'test-value');
    });
    
    // Retrieve and verify
    const value = await page.evaluate(() => {
      return localStorage.getItem('test-key');
    });
    
    expect(value).toBe('test-value');
  });

  test('console has no errors', async ({ page }) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for any async errors
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });
});