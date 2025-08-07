import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Perform authentication once
  await page.goto('/weekmenu/login');
  
  // Fill in credentials
  await page.locator('input[type="email"]').fill('test@example.com');
  await page.locator('input[type="password"]').fill('testpassword123');
  
  // Click sign in
  await page.locator('button:has-text("Sign in")').click();
  
  // Wait for redirect to authenticated page
  await page.waitForURL(/\/(weekmenu\/)$/);
  
  // Save signed-in state
  await page.context().storageState({ path: authFile });
});