import { test, expect } from '@playwright/test';

test.describe("example test", () => {
  test("example", async ({ page }) => {
    await page.goto('./')
    expect(true).toBeTruthy();
  });
})