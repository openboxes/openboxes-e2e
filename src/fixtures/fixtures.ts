import { test as baseTest } from '@playwright/test';

import { genericService,GenericServiceFixture } from '@/fixtures/genericServiceFixture';
import { loginPage, LoginPageFixture } from '@/fixtures/loginPageFixture';
import { navigate, NavigationFixture } from '@/fixtures/navigation';

type Fixtures = NavigationFixture & LoginPageFixture & GenericServiceFixture;

export const test = baseTest.extend<Fixtures>({
  navigate,
  loginPage,
  genericService,
});

export { expect } from '@playwright/test';
