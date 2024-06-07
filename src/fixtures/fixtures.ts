import { test as baseTest } from '@playwright/test';

import AuthService from '@/api/AuthService';
import GenericService from '@/api/GenericService';
import LocationService from '@/api/LocationService';
import CreateLocationGroupPage from '@/pages/CreateLocationGroupPage';
import CreateLocationPage from '@/pages/CreateLocationPage';
import CreateOrganizationPage from '@/pages/CreateOrganizationPage';
import CreateUserPage from '@/pages/CreateUserPage';
import EditLocationGroupPage from '@/pages/EditLocationGroupPage';
import EditOrganizationPage from '@/pages/EditOrganizationPage';
import EditUserPage from '@/pages/EditUserPage';
import ImpersonateBanner from '@/pages/ImpersonateBanner';
import LocationChooser from '@/pages/LocationChooser';
import LocationGroupsListPage from '@/pages/LocationGroupsListPage';
import LocationListPage from '@/pages/LocationListPage';
import LoginPage from '@/pages/LoginPage';
import Navbar from '@/pages/Navbar';
import OrganizationListPage from '@/pages/OrganizationListPage';
import UserListPage from '@/pages/UserListPage';
import LocationData from '@/utils/LocationData';

type Fixtures = {
  loginPage: LoginPage;
  genericService: GenericService;
  locationService: LocationService;
  authService: AuthService;
  navbar: Navbar;
  locationChooser: LocationChooser;
  mainLocation: LocationData;
  noManageInventoryDepot: LocationData;
  userListPage: UserListPage;
  createUserPage: CreateUserPage;
  editUserPage: EditUserPage;
  impersonateBanner: ImpersonateBanner;
  locationListPage: LocationListPage;
  createLocationPage: CreateLocationPage;
  organizationListPage: OrganizationListPage;
  createOrganizationPage: CreateOrganizationPage;
  editOrganizationPage: EditOrganizationPage;
  locationGroupsListPage: LocationGroupsListPage;
  createLocationGroupPage: CreateLocationGroupPage;
  editLocationGroupPage: EditLocationGroupPage;
};

export const test = baseTest.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  genericService: async ({ page }, use) =>
    use(new GenericService(page.request)),
  locationService: async ({ page }, use) =>
    use(new LocationService(page.request)),
  authService: async ({ page }, use) => use(new AuthService(page.request)),
  navbar: async ({ page }, use) => use(new Navbar(page)),
  locationChooser: async ({ page }, use) => use(new LocationChooser(page)),
  mainLocation: async ({ page }, use) =>
    use(new LocationData('main', page.request)),
  noManageInventoryDepot: async ({ page }, use) =>
    use(new LocationData('noManageInventoryDepot', page.request)),
  userListPage: async ({ page }, use) => use(new UserListPage(page)),
  createUserPage: async ({ page }, use) => use(new CreateUserPage(page)),
  editUserPage: async ({ page }, use) => use(new EditUserPage(page)),
  impersonateBanner: async ({ page }, use) => use(new ImpersonateBanner(page)),
  locationListPage: async ({ page }, use) => use(new LocationListPage(page)),
  createLocationPage: async ({ page }, use) =>
    use(new CreateLocationPage(page)),
  organizationListPage: async ({ page }, use) =>
    use(new OrganizationListPage(page)),
  createOrganizationPage: async ({ page }, use) =>
    use(new CreateOrganizationPage(page)),
  editOrganizationPage: async ({ page }, use) =>
    use(new EditOrganizationPage(page)),
  locationGroupsListPage: async ({ page }, use) =>
    use(new LocationGroupsListPage(page)),
  createLocationGroupPage: async ({ page }, use) =>
    use(new CreateLocationGroupPage(page)),
  editLocationGroupPage: async ({ page }, use) =>
    use(new EditLocationGroupPage(page)),
});

export { expect } from '@playwright/test';
