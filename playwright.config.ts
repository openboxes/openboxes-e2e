import 'dotenv/config';

import { defineConfig, devices } from '@playwright/test';

import AppConfig from './src/config/AppConfig';

const appConfig = AppConfig.instance;

appConfig.initialize();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!appConfig.isCI,
  /* Retry on CI only */
  retries: appConfig.isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  /* test timeout */
  timeout: 3 * 60 * 1000,
  use: {
    /* Base URL to use in actions like `await page.goto("/")`. */
    baseURL: appConfig.appURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    launchOptions: {
    // slowMo: 1000,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'data-setup',
      testMatch: 'data.setup.ts',
      testDir: './src/setup',
    },
    {
      name: 'auth-setup',
      testMatch: 'auth.setup.ts',
      testDir: './src/setup',
      dependencies: ['data-setup'],
    },
    {
      name: 'create-data-setup',
      testMatch: 'createData.setup.ts',
      testDir: './src/setup',
      dependencies: ['auth-setup'],
      use: {
        storageState: appConfig.users['main'].storagePath,
      },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        storageState: appConfig.users['main'].storagePath,
      },
      dependencies: ['auth-setup', 'create-data-setup'],
    },
  ],
});
