import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  timeout: 15 * 1000,  // 15 seconds instead of 30
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5176/weekmenu',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.js/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /global-teardown\.js/,
    },
    {
      name: 'chromium',
      use: { 
        headless: false,
      },
      dependencies: ['setup'],
    },
  ],

  // Run dev server with test environment
  webServer: {
    command: 'npm run dev:test -- --port 5176',
    port: 5176,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
  },
});