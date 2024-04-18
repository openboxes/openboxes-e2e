import Navbar from '@/pages/Navbar';
import { FixtureCallback } from '@/types';

export type NavbarFixture = {
  navbar: Navbar;
};

export const navbar: FixtureCallback<NavbarFixture> = async ({ page }, use) => {
  await use(new Navbar(page));
};
