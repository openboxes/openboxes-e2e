import path from 'node:path';

import env from 'env-var';

type UserCredentials = {
  username: string;
  password: string;
  storagePath: string;
};

/**
 * class representing the application configuration for end-to-end tests.
 */
class AppConfig {
  private static configInstance: AppConfig;

  // Base URL to use in actions like `await page.goto('./dashboard')`.
  public appURL!: string;

  // Flag indicating whether tests are running in Continuous Integration.
  public isCI!: boolean;

  // main user used for most of the tests
  public user!: UserCredentials;

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
    this.user = {
      username: env.get('USER_USERNAME').required().asString(),
      password: env.get('USER_PASSWORD').required().asString(),
      storagePath: path.join(process.cwd(), 'userAuthStorage/.auth-storage.json'),
    };
  }
}

export default AppConfig;
