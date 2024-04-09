import { test as baseTest } from '@playwright/test';

import {
  genericService,
  GenericServiceFixture,
} from '@/fixtures/genericServiceFixture';
import { loginPage, LoginPageFixture } from '@/fixtures/loginPageFixture';
import { navbar, NavbarFixture } from '@/fixtures/NavbarFixture';

type Fixtures = LoginPageFixture & GenericServiceFixture & NavbarFixture;

export const test = baseTest.extend<Fixtures>({
  loginPage,
  genericService,
  navbar,
});

export { expect } from '@playwright/test';
