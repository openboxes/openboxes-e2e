import { BrowserContext, test as baseTest } from '@playwright/test';

import AuthService from '@/api/AuthService';
import GenericService from '@/api/GenericService';
import LocationService from '@/api/LocationService';
import ReceivingService from '@/api/ReceivingService';
import StockMovementService from '@/api/StockMovementService';
import ImpersonateBanner from '@/components/ImpersonateBanner';
import LocationChooser from '@/components/LocationChooser';
import Navbar from '@/components/Navbar';
import AppConfig, {
  LOCATION_KEY,
  PRODUCT_KEY,
  USER_KEY,
} from '@/config/AppConfig';
import CreateInbound from '@/pages/inbound/create/CreateInboundPage';
import InboundListPage from '@/pages/inbound/list/InboundListPage';
import CreateInvoicePage from '@/pages/invoice/CreateInvoicePage';
import InvoiceListPage from '@/pages/invoice/InvoiceListPage';
import CreateLocationPage from '@/pages/location/createLocation/CreateLocationPage';
import LocationListPage from '@/pages/location/LocationListPage';
import CreateLocationGroupPage from '@/pages/locationGroup/CreateLocationGroupPage';
import EditLocationGroupPage from '@/pages/locationGroup/EditLocationGroupPage';
import LocationGroupsListPage from '@/pages/locationGroup/LocationGroupsListPage';
import LoginPage from '@/pages/LoginPage';
import CreateOrganizationPage from '@/pages/oranization/CreateOrganizationPage';
import EditOrganizationPage from '@/pages/oranization/EditOrganizationPage';
import OrganizationListPage from '@/pages/oranization/OrganizationListPage';
import CreatePersonPage from '@/pages/people/CreatePersonPage';
import PersonsListPage from '@/pages/people/PersonsListPage';
import CreateProductPage from '@/pages/product/CreateProductPage';
import ProductShowPage from '@/pages/product/productShow/ProductShowPage';
import CreatePutawayPage from '@/pages/putaway/CreatePutawayPage';
import PutawayDetailsPage from '@/pages/putaway/putawayDetails/PutawayDetailsPage';
import ReceivingPage from '@/pages/receiving/ReceivingPage';
import OldViewShipmentPage from '@/pages/stockMovementShow/OldViewShipmentPage';
import StockMovementShowPage from '@/pages/stockMovementShow/StockMovementShowPage';
import TransactionListPage from '@/pages/transactions/TransactionListPage';
import CreateUserPage from '@/pages/user/CreateUserPage';
import EditUserPage from '@/pages/user/editUser/EditUserPage';
import UserListPage from '@/pages/user/UserListPage';
import LocationData from '@/utils/LocationData';
import ProductData from '@/utils/ProductData';
import UserData from '@/utils/UserData';

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
  createInvoicePage: CreateInvoicePage;
  invoiceListPage: InvoiceListPage;
  personsListPage: PersonsListPage;
  createPersonPage: CreatePersonPage;
  createPutawayPage: CreatePutawayPage;
  putawayDetailsPage: PutawayDetailsPage;
  transactionListPage: TransactionListPage;
  oldViewShipmentPage: OldViewShipmentPage;
  // COMPONENTS
  navbar: Navbar;
  locationChooser: LocationChooser;
  impersonateBanner: ImpersonateBanner;
  // SERVICES
  genericService: GenericService;
  locationService: LocationService;
  authService: AuthService;
  stockMovementService: StockMovementService;
  receivingService: ReceivingService;
  // LOCATIONS DATA
  mainLocationService: LocationData;
  noManageInventoryDepotService: LocationData;
  supplierLocationService: LocationData;
  supplierAltLocationService: LocationData;
  depotLocationService: LocationData;
  wardLocationService: LocationData;
  noPickAndPutawayStockDepotService: LocationData;
  internalLocationService: LocationData;
  // PRODUCT DATA
  mainProductService: ProductData;
  otherProductService: ProductData;
  thirdProductService: ProductData;
  fourthProductService: ProductData;
  fifthProductService: ProductData;
  // USERS DATA
  mainUserService: UserData;
  altUserService: UserData;
  managerUserService: UserData;
  // USER CONTEXT
  mainUserContext: BrowserContext;
  altUserContext: BrowserContext;
  emptyUserContext: BrowserContext;
  managerUserContext: BrowserContext;
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
  createInvoicePage: async ({ page }, use) => use(new CreateInvoicePage(page)),
  invoiceListPage: async ({ page }, use) => use(new InvoiceListPage(page)),
  personsListPage: async ({ page }, use) => use(new PersonsListPage(page)),
  createPersonPage: async ({ page }, use) => use(new CreatePersonPage(page)),
  createPutawayPage: async ({ page }, use) => use(new CreatePutawayPage(page)),
  putawayDetailsPage: async ({ page }, use) =>
    use(new PutawayDetailsPage(page)),
  transactionListPage: async ({ page }, use) =>
    use(new TransactionListPage(page)),
  oldViewShipmentPage: async ({ page }, use) =>
    use(new OldViewShipmentPage(page)),
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
  receivingService: async ({ page }, use) =>
    use(new ReceivingService(page.request)),
  // LOCATIONS
  mainLocationService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.MAIN, page.request)),
  noManageInventoryDepotService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.NO_MANAGER_INENTORY, page.request)),
  supplierLocationService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.SUPPLIER, page.request)),
  supplierAltLocationService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.SUPPLIER_ALT, page.request)),
  depotLocationService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.DEPOT, page.request)),
  wardLocationService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.WARD, page.request)),
  noPickAndPutawayStockDepotService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.NO_PICK_AND_PUTAWAY_STOCK, page.request)),
  internalLocationService: async ({ page }, use) =>
    use(new LocationData(LOCATION_KEY.BIN_LOCATION, page.request)),
  // PRODUCTS
  mainProductService: async ({ page }, use) =>
    use(new ProductData(PRODUCT_KEY.ONE, page.request)),
  otherProductService: async ({ page }, use) =>
    use(new ProductData(PRODUCT_KEY.TWO, page.request)),
  thirdProductService: async ({ page }, use) =>
    use(new ProductData(PRODUCT_KEY.THREE, page.request)),
  fourthProductService: async ({ page }, use) =>
    use(new ProductData(PRODUCT_KEY.FOUR, page.request)),
  fifthProductService: async ({ page }, use) =>
    use(new ProductData(PRODUCT_KEY.FIVE, page.request)),
  // USERS
  mainUserService: async ({ page }, use) =>
    use(new UserData(USER_KEY.MAIN, page.request)),
  altUserService: async ({ page }, use) =>
    use(new UserData(USER_KEY.ALTERNATIVE, page.request)),
  managerUserService: async ({ page }, use) =>
    use(new UserData(USER_KEY.MANAGER, page.request)),
  // NEW USER CONTEXTS
  mainUserContext: async ({ browser }, use) => {
    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.main.storagePath,
    });

    await use(newCtx);

    await newCtx.close();
  },
  altUserContext: async ({ browser }, use) => {
    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.alternative.storagePath,
    });

    await use(newCtx);

    await newCtx.close();
  },
  emptyUserContext: async ({ browser }, use) => {
    const newCtx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });

    await use(newCtx);

    await newCtx.close();
  },

  managerUserContext: async ({ browser }, use) => {
    const newCtx = await browser.newContext({
      storageState: AppConfig.instance.users.manager.storagePath,
    });

    await use(newCtx);

    await newCtx.close();
  },
});

export { expect } from '@playwright/test';
