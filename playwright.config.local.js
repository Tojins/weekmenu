import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    // Use local dev server against local Supabase
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    
    // Test credentials from seed data
    storageState: {
      cookies: [],
      origins: []
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      use: { 
        ...devices['Desktop Chrome'],
        // Pre-authenticated state will be set up
        storageState: '.auth/user.json'
      },
      dependencies: ['setup'],
    },
  ],

  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev:test',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    env: {
      // Use test environment
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
    },
  },
});