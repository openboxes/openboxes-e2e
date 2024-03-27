import { test as baseTest } from "@playwright/test";

import Navigation from "../utils/Navigation";

export const test = baseTest.extend<{
    navigate: Navigation;
}>({
    navigate: async ({ page }, use) => {
        await use(new Navigation(page));
    },
});
