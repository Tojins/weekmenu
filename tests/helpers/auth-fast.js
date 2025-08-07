/**
 * Fast authentication helper using direct JWT injection
 * This is the fastest approach but requires knowledge of Supabase internals
 */

import { supabase } from '../../src/supabaseClient.js';

// Cache the session in memory for the test run
let cachedSession = null;

export async function loginTestUserFast(page, userNumber = 1) {
  const email = userNumber === 1 ? 'test@example.com' : 'test2@example.com';
  const password = 'testpassword123';
  
  // If we don't have a cached session, get one
  if (!cachedSession) {
    // Use the Supabase client directly to get a session
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(`Failed to authenticate: ${error.message}`);
    }
    
    cachedSession = data.session;
  }
  
  // Navigate to the app
  await page.goto('/weekmenu/', { waitUntil: 'domcontentloaded' });
  
  // Inject the session into localStorage
  await page.evaluate((session) => {
    // Supabase stores the session in localStorage
    const key = 'supabase.auth.token';
    localStorage.setItem(key, JSON.stringify({
      currentSession: session,
      expiresAt: Date.now() + (session.expires_in * 1000)
    }));
  }, cachedSession);
  
  // Reload to apply the session
  await page.reload({ waitUntil: 'domcontentloaded' });
  
  // Wait for the app to recognize the session
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  
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

export function clearSessionCache() {
  cachedSession = null;
}