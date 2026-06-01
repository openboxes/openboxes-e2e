import { Page } from '@playwright/test';

export const pageContainsValues = async (
  page: Page,
  values: string[]
): Promise<boolean> => {
  await page.waitForLoadState();
  const text = await page.locator('body').innerText();
  return values.every((value) => text.includes(value));
};
