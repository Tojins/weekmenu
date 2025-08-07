/**
 * Ultra-fast authentication by directly injecting Supabase session
 * This avoids any login flow and directly sets up the authenticated state
 */

export async function injectAuth(page, userNumber = 1) {
  const email = userNumber === 1 ? 'test@example.com' : 'test2@example.com';
  const userId = userNumber === 1 
    ? '00000000-0000-0000-0000-000000000001' 
    : '00000000-0000-0000-0000-000000000002';
  
  // Navigate to the app first
  await page.goto('/weekmenu/', { waitUntil: 'domcontentloaded' });
  
  // Wait for Supabase to be available
  await page.waitForFunction(() => window.supabase !== undefined, { timeout: 5000 });
  
  // Inject a mock session directly into Supabase's storage
  await page.evaluate(({ email, userId }) => {
    // Create a mock session that looks like a real Supabase session
    const mockSession = {
      access_token: 'mock-jwt-token-for-testing',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: userId,
        aud: 'authenticated',
        role: 'authenticated',
        email: email,
        email_confirmed_at: new Date().toISOString(),
        phone: '',
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    // Get the storage key that Supabase uses
    const storageKey = `sb-${window.supabase.supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    
    // Store the session
    localStorage.setItem(storageKey, JSON.stringify(mockSession));
    
    // Force Supabase to recognize the session
    window.supabase.auth.setSession(mockSession);
  }, { email, userId });
  
  // Give the app a moment to react to the auth change
  await page.waitForTimeout(500);
  
  // Verify we're logged in
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  
  return {
    email,
    id: userId,
    subscriptionId: userNumber === 1
      ? '00000000-0000-0000-0000-000000000101'
      : '00000000-0000-0000-0000-000000000102'
  };
}