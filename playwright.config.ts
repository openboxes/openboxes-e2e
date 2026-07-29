import 'dotenv/config';

import { execSync } from 'node:child_process';

import { defineConfig, devices } from '@playwright/test';

import AppConfig from './src/config/AppConfig';

// Regenerate ProductCodes.generated.ts before any test files are loaded.
// Runs whether tests are invoked via `npm test` (pretest hook) or `npx playwright test` directly.
execSync('node scripts/generateProductCodes.mjs', { stdio: 'inherit' });

const appConfig = AppConfig.instance;

appConfig.initialize();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!appConfig.isCI,
  /* Retry on CI only */
  retries: appConfig.isCI ? 2 : 0,
  /* Total worker pool. Each project below caps itself at 1 worker,
   * so this just lets the cycleCount project run on its own worker
   * alongside the rest of the suite instead of queuing behind it. */
  workers: 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  /* test timeout */
  timeout: 1 * 60 * 1000,
  use: {
    /* Base URL to use in actions like `await page.goto("/")`. */
    baseURL: appConfig.appURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    launchOptions: {
    // slowMo: 1000,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'validate-data-setup',
      testMatch: 'validateData.setup.ts',
      testDir: './src/setup',
    },
    {
      name: 'auth-setup',
      testMatch: 'auth.setup.ts',
      testDir: './src/setup',
      dependencies: ['validate-data-setup'],
    },
    {
      name: 'auth-setup-cycleCount',
      testMatch: 'authCycleCount.setup.ts',
      testDir: './src/setup',
      dependencies: ['auth-setup'],
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
      name: 'data-import-setup',
      testMatch: 'dataImport.setup.ts',
      testDir: './src/setup',
      dependencies: ['create-data-setup'],
      use: {
        storageState: appConfig.users['main'].storagePath,
      },
    },
    {
      name: 'validate-clean-state',
      testMatch: 'validateCleanState.setup.ts',
      testDir: './src/setup',
      dependencies: ['data-import-setup'],
      use: {
        storageState: appConfig.users['main'].storagePath,
      },
    },
    {
      name: 'chromium',
      testIgnore: '**/cycleCount/**',
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        storageState: appConfig.users['main'].storagePath,
      },
      dependencies: [
        'auth-setup',
        'create-data-setup',
        'data-import-setup',
        'validate-clean-state',
      ],
    },
    {
      name: 'chromium-cycleCount',
      testDir: './src/tests/cycleCount',
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        storageState: appConfig.users['main'].ccStoragePath,
      },
      dependencies: [
        'auth-setup-cycleCount',
        'create-data-setup',
        'data-import-setup',
        'validate-clean-state',
      ],
    },
  ],
});
