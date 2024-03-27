import { expect } from '@playwright/test';
import { test } from "../utils/fixtures";

test.describe("example test", () => {
  test("example", async ({ navigate }) => {
    await navigate.goToHome();
    expect(true).toBeTruthy();
  });
})