import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';
import { readFile, writeToFile } from '@/utils/FileIOUtils';

for (const [name, user] of Object.entries(AppConfig.instance.users)) {
  test(`authenticate ${name}`, async ({
    page,
    navbar,
    loginPage,
    locationService,
    locationChooser,
    genericService,
  }) => {
    await loginPage.goToPage();

    await loginPage.fillLoginForm(user.username, user.password);
    await loginPage.loginButton.click();

    const { data: location } = await locationService.getLocation(
      AppConfig.instance.locations['main'].id
    );
    await locationChooser.getOrganization(location.organization?.name).click();
    await locationChooser.getLocation(location.name).click();

    await navbar.isLoaded();

    const loggedInUser = await genericService.getLoggedInUser();

    // eslint-disable-next-line playwright/no-conditional-in-test
    const data = readFile(AppConfig.TEST_DATA_FILE_PATH) || {};

    data.users = { ...data?.users };
    data.users[`${name}`] = loggedInUser.id;

    writeToFile(AppConfig.TEST_DATA_FILE_PATH, data);

    await page.context().storageState({ path: user.storagePath });
  });
}
