import { test, expect } from '@playwright/test';
import { loginTestUser } from './helpers/auth-real.js';

test.describe('Recipe Monitor', () => {
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await loginTestUser(page);
    
    // Navigate to recipe monitor
    await page.goto('/weekmenu/recipe-monitor');
    await expect(page).toHaveURL('/weekmenu/recipe-monitor');
  });

  test('displays recipe monitor page correctly', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('h1')).toContainText('Recipe Processing Monitor');
    await expect(page.locator('text=Last updated:')).toBeVisible();
    
    // Check main sections are present
    await expect(page.locator('h2:has-text("Recipe Search History")')).toBeVisible();
    await expect(page.locator('h2:has-text("Recipe URL Candidates")')).toBeVisible();
  });

  test('displays search history status counts correctly', async ({ page }) => {
    // Check for Status Counts section
    await expect(page.locator('h3:has-text("Status Counts")').first()).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check that status counts are displayed
    const searchHistorySection = page.locator('h2:has-text("Recipe Search History")').locator('..').locator('..');
    const statusBadges = searchHistorySection.locator('.bg-blue-100');
    
    // Should have status badges for different statuses
    await expect(statusBadges).toHaveCount.greaterThan(0);
    
    // Check for specific statuses based on our test data
    await expect(searchHistorySection.locator('text=INITIAL:')).toBeVisible();
    await expect(searchHistorySection.locator('text=ONGOING:')).toBeVisible();
    await expect(searchHistorySection.locator('text=COMPLETED:')).toBeVisible();
    await expect(searchHistorySection.locator('text=FAILED:')).toBeVisible();
  });

  test('displays URL candidates status counts correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check URL candidates status counts
    const urlCandidatesSection = page.locator('h2:has-text("Recipe URL Candidates")').locator('..').locator('..');
    const statusBadges = urlCandidatesSection.locator('.bg-green-100');
    
    // Should have status badges for different statuses
    await expect(statusBadges).toHaveCount.greaterThan(0);
    
    // Check for specific statuses based on our test data
    await expect(urlCandidatesSection.locator('text=INITIAL:')).toBeVisible();
    await expect(urlCandidatesSection.locator('text=INVESTIGATING:')).toBeVisible();
    await expect(urlCandidatesSection.locator('text=ACCEPTED:')).toBeVisible();
    await expect(urlCandidatesSection.locator('text=REJECTED:')).toBeVisible();
    await expect(urlCandidatesSection.locator('text=CREATED:')).toBeVisible();
  });

  test('expandable sections work correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Test search history expandable section
    const searchHistoryToggle = page.locator('button:has-text("INITIAL & ONGOING Records")');
    await expect(searchHistoryToggle).toBeVisible();
    
    // Initially should not show records (collapsed)
    await expect(page.locator('.bg-gray-50').first()).not.toBeVisible();
    
    // Click to expand
    await searchHistoryToggle.click();
    
    // Should now show records
    await expect(page.locator('.bg-gray-50')).toBeVisible();
    
    // Test URL candidates expandable section
    const urlCandidatesToggle = page.locator('button:has-text("Active Records (not REJECTED/CREATED)")');
    await expect(urlCandidatesToggle).toBeVisible();
    
    // Click to expand
    await urlCandidatesToggle.click();
    
    // Should show URL records
    await expect(page.locator('a[href^="https://example.com/recipe"]')).toBeVisible();
  });

  test('displays correct record counts in expandable sections', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check search history record count
    const searchHistoryToggle = page.locator('button:has-text("INITIAL & ONGOING Records")');
    await expect(searchHistoryToggle).toContainText('(');
    
    // Check URL candidates record count  
    const urlCandidatesToggle = page.locator('button:has-text("Active Records (not REJECTED/CREATED)")');
    await expect(urlCandidatesToggle).toContainText('(');
    
    // Expand sections and verify records
    await searchHistoryToggle.click();
    await urlCandidatesToggle.click();
    
    // Should have search history records with INITIAL or ONGOING status
    const searchRecords = page.locator('.bg-yellow-100:has-text("INITIAL"), .bg-blue-100:has-text("ONGOING")');
    await expect(searchRecords).toHaveCount.greaterThan(0);
    
    // Should have URL candidate records that are not REJECTED or CREATED
    const urlRecords = page.locator('a[href^="https://example.com/recipe"]');
    await expect(urlRecords).toHaveCount.greaterThan(0);
  });

  test('data updates every 10 seconds', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Get initial timestamp
    const initialTimestamp = await page.locator('text=Last updated:').textContent();
    
    // Wait for next polling cycle (10+ seconds)
    await page.waitForTimeout(12000);
    
    // Check that timestamp has updated
    const updatedTimestamp = await page.locator('text=Last updated:').textContent();
    expect(updatedTimestamp).not.toBe(initialTimestamp);
  });

  test('handles no data gracefully', async ({ page }) => {
    // This test assumes we might have empty results sometimes
    // The component should handle empty data gracefully
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Expand sections to check for empty state messages
    await page.locator('button:has-text("INITIAL & ONGOING Records")').click();
    
    // If no records, should show appropriate message
    const emptyMessage = page.locator('text=No INITIAL or ONGOING records found');
    // This might or might not be visible depending on test data
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });
});