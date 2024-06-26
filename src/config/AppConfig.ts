import path from 'node:path';

import env from 'env-var';

import LocationConfig from '@/config/LocationConfig';
import TestUserConfig from '@/config/TestUserConfig';
import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import RoleType from '@/constants/RoleTypes';

/**
 * class representing the application configuration for end-to-end tests.
 */
class AppConfig {
  private static configInstance: AppConfig;

  public static AUTH_STORAGE_DIR_PATH = path.join(
    process.cwd(),
    '.authStorage'
  );

  // Base URL to use in actions like `await page.goto('./dashboard')`.
  public appURL!: string;

  // Flag indicating whether tests are running in Continuous Integration.
  public isCI!: boolean;

  // test users used in all of the tests
  public users!: Record<'main', TestUserConfig>;

  // test users used in all of the tests
  public locations!: Record<'main' | 'noManageInventoryDepot', LocationConfig>;

  // Private constructor to enforce singleton pattern.
  private constructor() {}

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
      main: new TestUserConfig(
        env.get('USER_MAIN_USERNAME').required().asString(),
        env.get('USER_MAIN_PASSWORD').required().asString(),
        '.auth-storage-MAIN-USER.json',
        new Set([
          RoleType.ROLE_SUPERUSER,
          RoleType.ROLE_FINANCE,
          RoleType.ROLE_PRODUCT_MANAGER,
          RoleType.ROLE_INVOICE,
          RoleType.ROLE_PURCHASE_APPROVER,
        ])
      ),
    };

    this.locations = {
      main: new LocationConfig(
        env.get('LOCATION_MAIN').required().asString(),
        new Set([
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
        LocationTypeCode.DEPOT
      ),
      noManageInventoryDepot: new LocationConfig(
        env.get('LOCATION_NO_MANAGE_INVENOTRY_DEPOT').required().asString(),
        new Set([
          ActivityCode.DYNAMIC_CREATION,
          ActivityCode.AUTOSAVE,
          ActivityCode.SUBMIT_REQUEST,
          ActivityCode.SEND_STOCK,
          ActivityCode.PLACE_REQUEST,
          ActivityCode.FULFILL_REQUEST,
          ActivityCode.EXTERNAL,
          ActivityCode.RECEIVE_STOCK,
        ]),
        LocationTypeCode.DEPOT
      ),
    };
  }
}

export default AppConfig;
