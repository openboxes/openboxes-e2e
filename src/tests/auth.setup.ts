import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';

test('authenticate', async ({ page, loginPage }) => {
  await loginPage.goToPage();

  const testingUser = AppConfig.instance.user;

  await loginPage.fillLoginForm(testingUser.username, testingUser.password);
  await loginPage.loginButton.click();

  await page.context().storageState({ path: testingUser.storagePath });
});
