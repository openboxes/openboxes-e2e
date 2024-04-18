import path from 'node:path';

import env from 'env-var';

import { ActivityCode } from '@/constants/ActivityCodes';
import { LocationTypeCode } from '@/constants/LocationTypeCode';
import RoleType from '@/constants/RoleTypes';
import LocationConfig from '@/utils/LocationConfig';
import TestUserConfig from '@/utils/TestUserConfig';

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
  public users!: Record<'main' | 'requestor', TestUserConfig>;

  // test users used in all of the tests
  public locations!: Record<'main' | 'ward', LocationConfig>;

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
        ])
      ),
      requestor: new TestUserConfig(
        env.get('USER_REQUESTOR_USERNAME').required().asString(),
        env.get('USER_REQUESTOR_PASSWORD').required().asString(),
        '.auth-storage-REQUESTOR-USER.json',
        new Set([RoleType.ROLE_REQUESTOR, RoleType.ROLE_MANAGER])
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
        ]),
        LocationTypeCode.DEPOT
      ),
      ward: new LocationConfig(
        env.get('LOCATION_WARD').required().asString(),
        new Set([ActivityCode.RECEIVE_STOCK, ActivityCode.SUBMIT_REQUEST]),
        LocationTypeCode.WARD
      ),
    };
  }
}

export default AppConfig;
