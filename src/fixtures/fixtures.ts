import { test as baseTest } from '@playwright/test';

import { navigate, NavigationFixture } from './navigation';

type Fixtures = NavigationFixture

export const test = baseTest.extend<Fixtures>({
  navigate: navigate,
});
