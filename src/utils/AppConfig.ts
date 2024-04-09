import path from 'node:path';

import env from 'env-var';

import RoleType from '@/constants/RoleTypes';
import TestUser from '@/utils/TestUser';

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

  // Base API URL to use for separate requests to the server
  public apiURL!: string;

  // Flag indicating whether tests are running in Continuous Integration.
  public isCI!: boolean;

  // test users used in all of the tests
  public users!: Record<'main' | 'requestor', TestUser>;

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
      main: new TestUser(
        env.get('USER_MAIN_USERNAME').required().asString(),
        env.get('USER_MAIN_PASSWORD').required().asString(),
        path.join(process.cwd(), '.auth-storage-MAIN-USER.json'),
        new Set([
          RoleType.ROLE_SUPERUSER,
          RoleType.ROLE_FINANCE,
          RoleType.ROLE_PRODUCT_MANAGER,
          RoleType.ROLE_INVOICE,
        ])
      ),
      requestor: new TestUser(
        env.get('USER_REQUESTOR_USERNAME').required().asString(),
        env.get('USER_REQUESTOR_PASSWORD').required().asString(),
        path.join(process.cwd(), '.auth-storage-REQUESTOR-USER.json'),
        new Set([RoleType.ROLE_REQUESTOR, RoleType.ROLE_MANAGER])
      )
    }
  }
}

export default AppConfig;
