/**
 * Persistent authentication helper using storage state
 * This speeds up tests by reusing authentication tokens
 */

import { chromium } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Store auth state in user's home directory, outside of project
const AUTH_DIR = path.join(os.homedir(), '.playwright-auth', 'weekmenu');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

export async function setupAuth() {
  // Create auth directory if it doesn't exist
  await fs.mkdir(AUTH_DIR, { recursive: true });
  
  // Check if auth file exists and is recent (less than 1 hour old)
  try {
    const stats = await fs.stat(AUTH_FILE);
    const hourAgo = Date.now() - (60 * 60 * 1000);
    if (stats.mtimeMs > hourAgo) {
      console.log('Using existing auth state');
      return;
    }
  } catch (e) {
    // File doesn't exist, continue with login
  }

  console.log('Setting up fresh authentication');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login with test user
  await page.goto('http://localhost:5176/weekmenu/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  
  // Save storage state
  await context.storageState({ path: AUTH_FILE });
  
  await browser.close();
  console.log('Authentication state saved');
}

export async function loginWithStorageState(page) {
  // Check if auth file exists
  try {
    await fs.access(AUTH_FILE);
  } catch {
    // Auth file doesn't exist, do regular login
    console.log('No persistent auth found, performing fresh login');
    await page.goto('/weekmenu/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    // Save the storage state for next time
    const context = page.context();
    await fs.mkdir(AUTH_DIR, { recursive: true });
    await context.storageState({ path: AUTH_FILE });
    
    return {
      email: 'test@example.com',
      id: '00000000-0000-0000-0000-000000000001',
      subscriptionId: '00000000-0000-0000-0000-000000000101'
    };
  }
  
  // Load the storage state
  const storageState = JSON.parse(await fs.readFile(AUTH_FILE, 'utf-8'));
  
  // Apply storage state to the page
  await page.context().addCookies(storageState.cookies);
  
  // Set localStorage items
  await page.goto('/weekmenu/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((storage) => {
    storage.origins?.forEach(origin => {
      origin.localStorage?.forEach(item => {
        localStorage.setItem(item.name, item.value);
      });
    });
  }, storageState);
  
  // Verify we're logged in by checking we're not redirected to login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 5000 });
  
  return {
    email: 'test@example.com',
    id: '00000000-0000-0000-0000-000000000001',
    subscriptionId: '00000000-0000-0000-0000-000000000101'
  };
}

export async function clearAuthState() {
  try {
    await fs.unlink(AUTH_FILE);
  } catch (e) {
    // Ignore if file doesn't exist
  }
}