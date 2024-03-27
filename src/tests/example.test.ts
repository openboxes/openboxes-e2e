import { expect } from "@playwright/test";

import { test } from "@/fixtures/fixtures";

test.describe("example test", () => {
    test("example", async ({ navigate }) => {
        await navigate.goToHome();
        expect(true).toBeTruthy();
    });
});
