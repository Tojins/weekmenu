import { chromium } from '@playwright/test';

async function globalSetup() {
  // Ensure local Supabase is running
  console.log('Checking if local Supabase is running...');
  
  try {
    const response = await fetch('http://localhost:54321/rest/v1/');
    if (!response.ok) {
      throw new Error('Local Supabase is not responding');
    }
    console.log('✓ Local Supabase is running');
  } catch (error) {
    console.error('✗ Local Supabase is not running');
    console.error('Please run: npm run supabase:start');
    process.exit(1);
  }

  // Create authenticated browser state for test user
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login
    await page.goto('http://localhost:5176/weekmenu/login');
    
    // Login with test user
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home
    await page.waitForURL('**/weekmenu/', { timeout: 10000 });
    
    // Save authenticated state
    await context.storageState({ path: '.auth/user.json' });
    console.log('✓ Test user authenticated state saved');
  } catch (error) {
    console.error('Failed to authenticate test user:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;