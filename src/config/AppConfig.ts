import path from 'node:path';

import env from 'env-var';

import LocationConfig from '@/config/LocationConfig';
import ProductConfig from '@/config/ProductConfig';
import TestUserConfig from '@/config/TestUserConfig';
import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import RoleType from '@/constants/RoleTypes';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

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

  public static TEST_DATA_FILE_PATH = path.join(process.cwd(), '.data.json');

  // Base URL to use in actions like `await page.goto('./dashboard')`.
  public appURL!: string;

  // Flag indicating whether tests are running in Continuous Integration.
  public isCI!: boolean;

  // test users used in all of the tests
  public users!: Record<'main', TestUserConfig>;

  // test users used in all of the tests
  public locations!: Record<
    'main' | 'supplier' | 'noManageInventoryDepot' | 'depot',
    LocationConfig
  >;

  // test products used in all of the tests
  public products!: Record<'prod_one' | 'prod_two', ProductConfig>;

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
    };

    this.locations = {
      main: new LocationConfig({
        key: 'main',
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
        ]),
        requiredType: LocationTypeCode.DEPOT,
        required: true,
      }),
      depot: new LocationConfig({
        key: 'depot',
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
        requiredType: LocationTypeCode.DEPOT,
      }),
      supplier: new LocationConfig({
        key: 'supplier',
        name: this.uniqueIdentifier.generateUniqueString('supplier'),
        requiredActivityCodes: new Set([
          ActivityCode.FULFILL_ORDER,
          ActivityCode.SEND_STOCK,
          ActivityCode.EXTERNAL,
        ]),
        requiredType: LocationTypeCode.SUPPLIER,
      }),
      noManageInventoryDepot: new LocationConfig({
        key: 'noManageInventoryDepot',
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
        requiredType: LocationTypeCode.DEPOT,
      }),
    };

    this.products = {
      prod_one: new ProductConfig({
        key: 'prod_one',
        name: this.uniqueIdentifier.generateUniqueString('product-one'),
        quantity: 122,
      }),
      prod_two: new ProductConfig({
        key: 'prod_two',
        name: this.uniqueIdentifier.generateUniqueString('product-two'),
        quantity: 123,
      }),
    };
  }
}

export default AppConfig;
