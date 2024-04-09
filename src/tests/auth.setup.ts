import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';
import { assertAllRequiredRoles } from '@/utils/roleUtils';

const testingUser = AppConfig.instance.user;

// eslint-disable-next-line playwright/expect-expect
test('authenticate', async ({ page, loginPage, genericService }) => {
  await loginPage.goToPage();

  await loginPage.fillLoginForm(testingUser.username, testingUser.password);
  await loginPage.loginButton.click();

  await page.context().storageState({ path: testingUser.storagePath });

  const { data } = await genericService.getAppContext();
  
  const userGlobalRoles = data?.user?.roles || [];
  const currentLocationRoles = data?.currentLocationRoles || [];
  const allUserRoles = new Set([...userGlobalRoles, ...currentLocationRoles]);
  assertAllRequiredRoles(allUserRoles, testingUser.requiredRoles)
});
