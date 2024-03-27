import { test as baseTest } from "@playwright/test";
import Navigation from "./Navigation";

type Fixtures = {
  navigate: Navigation;
};

const test = baseTest.extend<Fixtures>({
    navigate: async ({ page }, use) => {
    await use(new Navigation(page));
  },
});

export { test };
