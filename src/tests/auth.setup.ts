import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';
import { assertAllRequiredRoles } from '@/utils/roleUtils';

const authUsers = [
  { name: 'main user', user: AppConfig.instance.user },
  { name: 'requestor user', user: AppConfig.instance.requestor },
];

for (const { name, user } of authUsers) {
  // eslint-disable-next-line playwright/expect-expect
  test(`authenticate ${name}`, async ({
    page,
    loginPage,
    genericService,
  }) => {
    await loginPage.goToPage();

    await loginPage.fillLoginForm(user.username, user.password);
    await loginPage.loginButton.click();

    await page.context().storageState({ path: user.storagePath });

    const { data } = await genericService.getAppContext();

    const userGlobalRoles = data?.user?.roles || [];
    const currentLocationRoles = data?.currentLocationRoles || [];
    const allUserRoles = new Set([...userGlobalRoles, ...currentLocationRoles]);
    assertAllRequiredRoles(allUserRoles, user.requiredRoles);
  });
}
