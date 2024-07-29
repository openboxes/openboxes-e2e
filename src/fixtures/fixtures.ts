import { test as baseTest } from '@playwright/test';

import AuthService from '@/api/AuthService';
import GenericService from '@/api/GenericService';
import LocationService from '@/api/LocationService';
import StockMovementService from '@/api/StockMovementService';
import ImpersonateBanner from '@/components/ImpersonateBanner';
import LocationChooser from '@/components/LocationChooser';
import Navbar from '@/components/Navbar';
import CreateInbound from '@/pages/inbound/create/CreateInboundPage';
import InboundListPage from '@/pages/inbound/list/InboundListPage';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import CreateLocationGroupPage from '@/pages/locationGroup/CreateLocationGroupPage';
import EditLocationGroupPage from '@/pages/locationGroup/EditLocationGroupPage';
import LocationGroupsListPage from '@/pages/locationGroup/LocationGroupsListPage';
import LoginPage from '@/pages/LoginPage';
import CreateOrganizationPage from '@/pages/oranization/CreateOrganizationPage';
import EditOrganizationPage from '@/pages/oranization/EditOrganizationPage';
import OrganizationListPage from '@/pages/oranization/OrganizationListPage';
import CreateProductPage from '@/pages/product/CreateProductPage';
import ProductShowPage from '@/pages/product/productShow/ProductShowPage';
import ReceivingPage from '@/pages/receiving/ReceivingPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import CreateUserPage from '@/pages/user/CreateUserPage';
import EditUserPage from '@/pages/user/editUser/EditUserPage';
import UserListPage from '@/pages/user/UserListPage';
import LocationData from '@/utils/LocationData';
import ProductData from '@/utils/ProductData';

type Fixtures = {
  // PAGES
  loginPage: LoginPage;
  locationListPage: LocationListPage;
  createLocationPage: CreateLocationPage;
  organizationListPage: OrganizationListPage;
  createOrganizationPage: CreateOrganizationPage;
  editOrganizationPage: EditOrganizationPage;
  locationGroupsListPage: LocationGroupsListPage;
  createLocationGroupPage: CreateLocationGroupPage;
  editLocationGroupPage: EditLocationGroupPage;
  stockMovementShowPage: StockMovementShowPage;
  userListPage: UserListPage;
  createUserPage: CreateUserPage;
  editUserPage: EditUserPage;
  createProductPage: CreateProductPage;
  productShowPage: ProductShowPage;
  createInboundPage: CreateInbound;
  inboundListPage: InboundListPage;
  receivingPage: ReceivingPage;
  // COMPONENTS
  navbar: Navbar;
  locationChooser: LocationChooser;
  impersonateBanner: ImpersonateBanner;
  // SERVICES
  genericService: GenericService;
  locationService: LocationService;
  authService: AuthService;
  stockMovementService: StockMovementService;
  // LOCATIONS
  mainLocation: LocationData;
  noManageInventoryDepot: LocationData;
  supplierLocation: LocationData;
  supplierAltLocation: LocationData;
  depotLocation: LocationData;
  // PRODUCT DATA
  mainProduct: ProductData;
  otherProduct: ProductData;
};

export const test = baseTest.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  userListPage: async ({ page }, use) => use(new UserListPage(page)),
  createUserPage: async ({ page }, use) => use(new CreateUserPage(page)),
  editUserPage: async ({ page }, use) => use(new EditUserPage(page)),
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
  receivingPage: async ({ page }, use) => use(new ReceivingPage(page)),
  createInboundPage: async ({ page }, use) => use(new CreateInbound(page)),
  inboundListPage: async ({ page }, use) => use(new InboundListPage(page)),
  stockMovementShowPage: async ({ page }, use) =>
    use(new StockMovementShowPage(page)),
  createProductPage: async ({ page }, use) => use(new CreateProductPage(page)),
  productShowPage: async ({ page }, use) => use(new ProductShowPage(page)),
  // COMPONENTS
  navbar: async ({ page }, use) => use(new Navbar(page)),
  locationChooser: async ({ page }, use) => use(new LocationChooser(page)),
  impersonateBanner: async ({ page }, use) => use(new ImpersonateBanner(page)),
  // SERVICES
  genericService: async ({ page }, use) =>
    use(new GenericService(page.request)),
  locationService: async ({ page }, use) =>
    use(new LocationService(page.request)),
  authService: async ({ page }, use) => use(new AuthService(page.request)),
  stockMovementService: async ({ page }, use) =>
    use(new StockMovementService(page.request)),
  // LOCATIONS
  mainLocation: async ({ page }, use) =>
    use(new LocationData('main', page.request)),
  noManageInventoryDepot: async ({ page }, use) =>
    use(new LocationData('noManageInventoryDepot', page.request)),
  supplierLocation: async ({ page }, use) =>
    use(new LocationData('supplier', page.request)),
  supplierAltLocation: async ({ page }, use) =>
    use(new LocationData('supplierAlt', page.request)),
  depotLocation: async ({ page }, use) =>
    use(new LocationData('depot', page.request)),
  // PRODUCTS
  mainProduct: async ({ page }, use) =>
    use(new ProductData('productOne', page.request)),
  otherProduct: async ({ page }, use) =>
    use(new ProductData('productTwo', page.request)),
});

export { expect } from '@playwright/test';
