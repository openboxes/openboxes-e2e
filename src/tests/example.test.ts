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

  test('Open dashboard page as a main test user in ward location', async ({
    page,
    navbar,
    locationChooser,
    wardLocation,
  }) => {
    await page.goto('./dashboard');

    await navbar.locationChooserButton.click();

    await locationChooser
      .getOrganization(wardLocation.organization?.name)
      .click();
    await locationChooser.getLocation(wardLocation.name).click();

    await navbar.profileButton.click();
    await expect(navbar.navbar).toContainText(
      AppConfig.instance.users['requestor'].username,
      { ignoreCase: true }
    );
  });

  test('Open dashboard page as a main test user in ward location 2', async ({
    page,
    navbar,
  }) => {
    await page.goto('./dashboard');

    await navbar.profileButton.click();
    await expect(navbar.navbar).toContainText(
      AppConfig.instance.users['requestor'].username,
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
});
