import { test, expect } from '@playwright/test';

test.describe("example test", () => {
  test("example", async ({ page }) => {
    await page.goto('http://localhost:8080/openboxes/')
    expect(true).toBeTruthy();
  });
})