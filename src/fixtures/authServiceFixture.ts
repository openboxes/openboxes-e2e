import AuthService from '@/api/AuthService';
import { FixtureCallback } from '@/types';

export type AuthServiceFixture = {
  authService: AuthService;
};

export const authService: FixtureCallback<AuthServiceFixture> = async (
  { page },
  use
) => {
  await use(new AuthService(page.request));
};
