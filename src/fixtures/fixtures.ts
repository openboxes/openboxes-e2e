import { test as baseTest } from '@playwright/test';

import { loginPage, LoginPageFixture } from '@/fixtures/loginPageFixture';
import { navigate, NavigationFixture } from '@/fixtures/navigation';

type Fixtures = NavigationFixture & LoginPageFixture;

export const test = baseTest.extend<Fixtures>({
  navigate,
  loginPage,
});

export { expect } from '@playwright/test';
