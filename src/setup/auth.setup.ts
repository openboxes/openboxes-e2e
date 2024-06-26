import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';

for (const [name, user] of Object.entries(AppConfig.instance.users)) {
  test(`authenticate ${name}`, async ({
    page,
    navbar,
    loginPage,
    locationService,
    locationChooser,
  }) => {
    await loginPage.goToPage();

    await loginPage.fillLoginForm(user.username, user.password);
    await loginPage.loginButton.click();

    const { data } = await locationService.getLocation(
      AppConfig.instance.locations['main'].id
    );
    await locationChooser.getOrganization(data.organization?.name).click();
    await locationChooser.getLocation(data.name).click();

    await navbar.isLoaded();

    await page.context().storageState({ path: user.storagePath });
  });
}
