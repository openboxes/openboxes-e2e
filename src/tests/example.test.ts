import { expect } from '@playwright/test';

import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';

test.describe('example test for main testing user', () => {
  test('Open dashboard page as a main test user', async ({ page, navbar }) => {
    await page.goto('./dashboard');
    await navbar.profileButton.click();
    await expect(navbar.navbar).toContainText(
      AppConfig.instance.users['main'].username,
      { ignoreCase: true }
    );
  });
});

test.describe('example test for requestor testing user', () => {
  test.use({ storageState: AppConfig.instance.users['requestor'].storagePath });
  test('Open dashboard page as a requestor user', async ({ page, navbar }) => {
    await page.goto('./dashboard');
    await navbar.profileButton.click();
    await expect(navbar.navbar).toContainText(
      AppConfig.instance.users['requestor'].username,
      { ignoreCase: true }
    );
  });
