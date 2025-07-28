/**
 * Real authentication helper for tests using local Supabase
 * This replaces auth mocking with actual login using test users
 */

export async function loginTestUser(page, userNumber = 1) {
  const email = userNumber === 1 ? 'test@example.com' : 'test2@example.com';
  const password = 'testpassword123';
  
  // Navigate to login page - optimized to skip network idle
  await page.goto('/weekmenu/login', { waitUntil: 'domcontentloaded' });
  
  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  
  // Return user info
  return {
    email,
    id: userNumber === 1 
      ? '00000000-0000-0000-0000-000000000001' 
      : '00000000-0000-0000-0000-000000000002',
    subscriptionId: userNumber === 1
      ? '00000000-0000-0000-0000-000000000101'
      : '00000000-0000-0000-0000-000000000102'
  };
}

export async function ensureLoggedOut(page) {
  // Clear all cookies
  await page.context().clearCookies();
  
  // Navigate to a page first to access localStorage
  try {
    // Only clear storage if we're on a valid page
    if (page.url() !== 'about:blank') {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }
  } catch (e) {
    // If we can't access storage, that's fine - we're logged out
  }
}

export async function getSupabaseClient(page) {
  // Get the Supabase client from the page context
  return await page.evaluate(() => window.supabase);
}

// Helper to wait for Supabase to be ready
export async function waitForSupabase(page) {
  await page.waitForFunction(() => window.supabase !== undefined, { timeout: 10000 });
}