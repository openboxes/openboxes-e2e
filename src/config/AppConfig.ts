import path from 'node:path';

import env from 'env-var';

import LocationConfig from '@/config/LocationConfig';
import ProductConfig from '@/config/ProductConfig';
import TestUserConfig from '@/config/TestUserConfig';
import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import RoleType from '@/constants/RoleTypes';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

export enum USER_KEY {
  MAIN = 'main',
  ALTERNATIVE = 'alternative',
  MANAGER = 'manager',
}

export enum LOCATION_KEY {
  MAIN = 'main',
  SUPPLIER = 'supplier',
  SUPPLIER_ALT = 'supplierAlt',
  NO_MANAGER_INENTORY = 'noManageInventoryDepot',
  DEPOT = 'depot',
  WARD = 'ward',
  NO_PICK_AND_PUTAWAY_STOCK = 'noPickAndPutawayStockDepot',
}

export enum PRODUCT_KEY {
  ONE = 'productOne',
  TWO = 'productTwo',
}

/**
 * class representing the application configuration for end-to-end tests.
 */
class AppConfig {
  private static configInstance: AppConfig;

  private uniqueIdentifier: UniqueIdentifier;

  public static AUTH_STORAGE_DIR_PATH = path.join(
    process.cwd(),
    '.authStorage'
  );

  public static LOCAL_FILES_DIR_PATH = path.join(process.cwd(), 'localFiles');

  public static TEST_DATA_FILE_PATH = path.join(process.cwd(), '.data.json');

  // Base URL to use in actions like `await page.goto('./dashboard')`.
  public appURL!: string;

  // Flag indicating whether tests are running in Continuous Integration.
  public isCI!: boolean;

  // test users used in all of the tests
  public users!: Record<USER_KEY, TestUserConfig>;

  // test users used in all of the tests
  public locations!: Record<LOCATION_KEY, LocationConfig>;

  // test products used in all of the tests
  public products!: Record<PRODUCT_KEY, ProductConfig>;

  // Private constructor to enforce singleton pattern.
  private constructor() {
    this.uniqueIdentifier = new UniqueIdentifier();
  }

  /**
   * Retrieves the singleton instance of AppConfig.
   * If an instance doesn't exist, it creates one.
   * @returns {AppConfig} The singleton instance of AppConfig.
   */
  public static get instance(): AppConfig {
    if (!AppConfig.configInstance) {
      AppConfig.configInstance = new AppConfig();
    }

    return AppConfig.configInstance;
  }

  /**
   * Initializes the AppConfig instance with configuration values from environment variables.
   */
  public initialize() {
    this.appURL = env.get('APP_BASE_URL').required().asString();

    this.isCI = env.get('CI').default('false').asBool();

    this.users = {
      main: new TestUserConfig({
        key: USER_KEY.MAIN,
        username: env.get('USER_MAIN_USERNAME').required().asString(),
        password: env.get('USER_MAIN_PASSWORD').required().asString(),
        storageFileName: '.auth-storage-MAIN-USER.json',
        requiredRoles: new Set([
          RoleType.ROLE_SUPERUSER,
          RoleType.ROLE_FINANCE,
          RoleType.ROLE_PRODUCT_MANAGER,
          RoleType.ROLE_INVOICE,
          RoleType.ROLE_PURCHASE_APPROVER,
        ]),
      }),
      alternative: new TestUserConfig({
        key: USER_KEY.ALTERNATIVE,
        username: env.get('USER_ALT_USERNAME').required().asString(),
        password: env.get('USER_ALT_PASSWORD').required().asString(),
        storageFileName: '.auth-storage-ALT-USER.json',
        requiredRoles: new Set([
          RoleType.ROLE_SUPERUSER,
          RoleType.ROLE_FINANCE,
          RoleType.ROLE_PRODUCT_MANAGER,
          RoleType.ROLE_INVOICE,
          RoleType.ROLE_PURCHASE_APPROVER,
        ]),
      }),
      manager: new TestUserConfig({
        key: USER_KEY.MANAGER,
        username: env.get('USER_MANAGER_USERNAME').required().asString(),
        password: env.get('USER_MANAGER_PASSWORD').required().asString(),
        storageFileName: '.auth-storage-MANAGER-USER.json',
        requiredRoles: new Set([RoleType.ROLE_MANAGER]),
      }),
    };

    this.locations = {
      main: new LocationConfig({
        key: LOCATION_KEY.MAIN,
        id: env.get('LOCATION_MAIN').required().asString(),
        requiredActivityCodes: new Set([
          ActivityCode.MANAGE_INVENTORY,
          ActivityCode.DYNAMIC_CREATION,
          ActivityCode.AUTOSAVE,
          ActivityCode.SUBMIT_REQUEST,
          ActivityCode.SEND_STOCK,
          ActivityCode.PLACE_REQUEST,
          ActivityCode.FULFILL_REQUEST,
          ActivityCode.EXTERNAL,
          ActivityCode.RECEIVE_STOCK,
          ActivityCode.PARTIAL_RECEIVING,
          ActivityCode.PICK_STOCK,
          ActivityCode.PUTAWAY_STOCK,
        ]),
        type: LocationTypeCode.DEPOT,
        required: true,
      }),
      depot: new LocationConfig({
        id: env.get('LOCATION_DEPOT').asString(),
        key: LOCATION_KEY.DEPOT,
        name: this.uniqueIdentifier.generateUniqueString('depot'),
        requiredActivityCodes: new Set([
          ActivityCode.MANAGE_INVENTORY,
          ActivityCode.PLACE_ORDER,
          ActivityCode.PLACE_REQUEST,
          ActivityCode.FULFILL_REQUEST,
          ActivityCode.SEND_STOCK,
          ActivityCode.RECEIVE_STOCK,
          ActivityCode.PUTAWAY_STOCK,
          ActivityCode.PICK_STOCK,
          ActivityCode.EXTERNAL,
          ActivityCode.ENABLE_REQUESTOR_APPROVAL_NOTIFICATIONS,
          ActivityCode.ENABLE_FULFILLER_APPROVAL_NOTIFICATIONS,
          ActivityCode.SUBMIT_REQUEST,
        ]),
        required: false,
        type: LocationTypeCode.DEPOT,
      }),
      supplier: new LocationConfig({
        id: env.get('LOCATION_SUPPLIER').asString(),
        key: LOCATION_KEY.SUPPLIER,
        name: this.uniqueIdentifier.generateUniqueString('supplier'),
        requiredActivityCodes: new Set([
          ActivityCode.FULFILL_ORDER,
          ActivityCode.SEND_STOCK,
          ActivityCode.EXTERNAL,
        ]),
        required: false,
        type: LocationTypeCode.SUPPLIER,
      }),
      supplierAlt: new LocationConfig({
        id: env.get('LOCATION_SUPPLIER_ALT').asString(),
        key: LOCATION_KEY.SUPPLIER_ALT,
        name: this.uniqueIdentifier.generateUniqueString('supplier-alt'),
        requiredActivityCodes: new Set([
          ActivityCode.FULFILL_ORDER,
          ActivityCode.SEND_STOCK,
          ActivityCode.EXTERNAL,
        ]),
        required: false,
        type: LocationTypeCode.SUPPLIER,
      }),
      noManageInventoryDepot: new LocationConfig({
        id: env.get('LOCATION_NO_MANAGE_INVENOTRY_DEPOT').asString(),
        key: LOCATION_KEY.NO_MANAGER_INENTORY,
        name: this.uniqueIdentifier.generateUniqueString('no-manage-inventory'),
        requiredActivityCodes: new Set([
          ActivityCode.DYNAMIC_CREATION,
          ActivityCode.AUTOSAVE,
          ActivityCode.SUBMIT_REQUEST,
          ActivityCode.SEND_STOCK,
          ActivityCode.PLACE_REQUEST,
          ActivityCode.FULFILL_REQUEST,
          ActivityCode.EXTERNAL,
          ActivityCode.RECEIVE_STOCK,
        ]),
        required: false,
        type: LocationTypeCode.DEPOT,
      }),

      ward: new LocationConfig({
        id: env.get('LOCATION_WARD').asString(),
        key: LOCATION_KEY.WARD,
        name: this.uniqueIdentifier.generateUniqueString('ward'),
        requiredActivityCodes: new Set([
          ActivityCode.SUBMIT_REQUEST,
          ActivityCode.RECEIVE_STOCK,
        ]),
        required: false,
        type: LocationTypeCode.WARD,
      }),

      noPickAndPutawayStockDepot: new LocationConfig({
        id: env.get('LOCATION_NO_PICK_AND_PUTAWAY_STOCK_DEPOT').asString(),
        key: LOCATION_KEY.NO_PICK_AND_PUTAWAY_STOCK,
        name: this.uniqueIdentifier.generateUniqueString('no-pickandputawaystock-depot'),
        requiredActivityCodes: new Set([
          ActivityCode.MANAGE_INVENTORY,
          ActivityCode.DYNAMIC_CREATION,
          ActivityCode.AUTOSAVE,
          ActivityCode.SUBMIT_REQUEST,
          ActivityCode.SEND_STOCK,
          ActivityCode.PLACE_REQUEST,
          ActivityCode.FULFILL_REQUEST,
          ActivityCode.EXTERNAL,
          ActivityCode.RECEIVE_STOCK,
          ActivityCode.PARTIAL_RECEIVING,
        ]),
        required: false,
        type: LocationTypeCode.DEPOT,
      }),



    };

    this.products = {
      productOne: new ProductConfig({
        id: env.get('PRODUCT_ONE').asString(),
        key: PRODUCT_KEY.ONE,
        name: this.uniqueIdentifier.generateUniqueString('product-one'),
        quantity: 122,
        required: false,
      }),
      productTwo: new ProductConfig({
        id: env.get('PRODUCT_TWO').asString(),
        key: PRODUCT_KEY.TWO,
        name: this.uniqueIdentifier.generateUniqueString('product-two'),
        quantity: 123,
        required: false,
      }),
    };
  }
}

export default AppConfig;
