import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';

const authUsers = [
  { name: 'main user', user: AppConfig.instance.user },
  { name: 'requestor user', user: AppConfig.instance.requestor },
];

for (const { name, user } of authUsers) {
  test(`authenticate ${name}`, async ({
    page,
    navbar,
    loginPage,
    genericService,
  }) => {
    await loginPage.goToPage();

    await loginPage.fillLoginForm(user.username, user.password);
    await loginPage.loginButton.click();

    await navbar.isLoaded();

    await page.context().storageState({ path: user.storagePath });

    const { data } = await genericService.getAppContext();

    const userGlobalRoles = data?.user?.roles || [];
    const currentLocationRoles = data?.currentLocationRoles || [];
    const allUserRoles = new Set([...userGlobalRoles, ...currentLocationRoles]);
    user.assertAllRequiredRoles(allUserRoles);
  });
}
