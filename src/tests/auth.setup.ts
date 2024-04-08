import { test } from '@/fixtures/fixtures';
import AppConfig from '@/utils/AppConfig';

test('authenticate', async ({ loginPage }) => {
  await loginPage.goToPage();

  const testingUser = AppConfig.instance.user;

  await loginPage.fillLoginForm(testingUser.username, testingUser.password);
  await loginPage.loginButton.click();
});
