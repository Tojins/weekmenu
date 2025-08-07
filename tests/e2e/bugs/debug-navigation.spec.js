import { expect, test } from '@playwright/test';
import { loginTestUser } from '../../helpers/auth-real.js';

test('debug add-to-list page structure', async ({ page }) => {
  await loginTestUser(page);
  
  // Navigate to add-to-list
  await page.goto('/weekmenu/add-to-list');
  await page.waitForLoadState('networkidle');
  
  // Log the page content
  const bodyText = await page.locator('body').textContent();
  console.log('Page body text:', bodyText);
  
  // Check what elements are present
  const hasMain = await page.locator('main').count();
  console.log('Main elements found:', hasMain);
  
  const hasGradient = await page.locator('.bg-gradient-to-br').count();
  console.log('Gradient elements found:', hasGradient);
  
  // Check if we're being redirected
  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-add-to-list.png', fullPage: true });
  
  // The navigation should work now
  expect(finalUrl).toContain('/add-to-list');
});