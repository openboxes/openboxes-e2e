import env from "env-var";

class AppConfig {
    private static configInstance: AppConfig;

    // Base URL to use in actions like `await page.goto('./dashboard')`.
    public appURL!: string;

    // Are tests running in Continuous Integration
    public isCI!: boolean;

    private constructor() {}

    public static get instance(): AppConfig {
        if (!AppConfig.configInstance) {
            AppConfig.configInstance = new AppConfig();
        }

        return AppConfig.configInstance;
    }

    public initialize() {
        this.appURL = env.get("APP_BASE_URL").required().asString();
        this.isCI = env.get("CI").default("false").asBool();
    }
}

export default AppConfig;
