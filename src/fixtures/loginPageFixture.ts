import LoginPage from '@/pages/LoginPage';
import { FixtureCallback } from '@/types';

export type LoginPageFixture = {
  loginPage: LoginPage;
};

export const loginPage: FixtureCallback<LoginPageFixture> = async (
  { page },
  use
) => {
  await use(new LoginPage(page));
};
