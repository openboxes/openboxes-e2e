import { expect, test } from '@/fixtures/fixtures';
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

  test('Open dashboard page as a reqestor user in ward location', async ({
    page,
    navbar,
    wardLocation,
    mainLocation,
  }) => {
    await wardLocation.switchLocation();
    const location = await wardLocation.getLocation();

    await page.goto('./dashboard');

    await navbar.profileButton.click();
    await expect(navbar.navbar).toContainText(
      AppConfig.instance.users['requestor'].username,
      { ignoreCase: true }
    );
    await expect(navbar.locationChooserButton).toContainText(location.name);

    // cleanup, switch back to mainLocation
    await mainLocation.switchLocation();
  });

  test('Open dashboard page as a requestor test user in main location', async ({
    page,
    navbar,
    mainLocation,
  }) => {
    const location = await mainLocation.getLocation();

    await page.goto('./dashboard');

    await navbar.profileButton.click();
    await expect(navbar.navbar).toContainText(
      AppConfig.instance.users['requestor'].username,
      { ignoreCase: true }
    );
    await expect(navbar.locationChooserButton).toContainText(location.name);
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
});
