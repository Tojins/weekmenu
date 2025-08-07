import { defineConfig } from '@playwright/test';
import baseConfig from '../playwright.config.js';

// Extend the base config and add auth-specific settings
export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    // Use authenticated state for all tests
    storageState: '../playwright/.auth/user.json',
  },

  projects: [
    // Setup project runs first to create auth state
    {
      name: 'setup',
      testMatch: /fixtures\/auth\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { 
        headless: false,
      },
      dependencies: ['setup'], // Depends on setup completing first
    },
  ],
});