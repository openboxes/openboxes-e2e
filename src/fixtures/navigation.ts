import { FixtureCallback } from '@/types';
import Navigation from '@/utils/Navigation';

export type NavigationFixture = {
  navigate: Navigation;
};

export const navigate: FixtureCallback<NavigationFixture> = async ({ page }, use) => {
  await use(new Navigation(page));
};