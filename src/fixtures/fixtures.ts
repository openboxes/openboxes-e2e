import { test as baseTest } from '@playwright/test';

import {
  authService,
  type AuthServiceFixture,
} from '@/fixtures/authServiceFixture';
import {
  genericService,
  GenericServiceFixture,
} from '@/fixtures/genericServiceFixture';
import {
  locationChooser,
  LocationChooserFixture,
} from '@/fixtures/LocationChooserFixture';
import {
  locationService,
  LocationServiceFixture,
} from '@/fixtures/locationServiceFixture';
import { loginPage, LoginPageFixture } from '@/fixtures/loginPageFixture';
import { navbar, NavbarFixture } from '@/fixtures/NavbarFixture';

type Fixtures = LoginPageFixture &
  GenericServiceFixture &
  NavbarFixture &
  LocationServiceFixture &
  AuthServiceFixture &
  LocationChooserFixture;

export const test = baseTest.extend<Fixtures>({
  loginPage,
  genericService,
  locationService,
  authService,
  navbar,
  locationChooser,
});

export { expect } from '@playwright/test';
