import { expect, Locator, Page } from '@playwright/test';

abstract class BasePageModel {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // tab content is fetched once per page load, so when it fails to render,
  // re-clicking the tab never refetches it — only a reload does
  protected async openTab(
    tab: Locator,
    tabContent: { isLoaded: () => Promise<void> }
  ) {
    let reloadOnRetry = false;
    await expect(async () => {
      if (reloadOnRetry) {
        await this.page.reload();
      }
      reloadOnRetry = true;
      await tab.click();
      await tabContent.isLoaded();
    }).toPass({ timeout: 45000, intervals: [500, 1000, 2000] });
  }
}

export default BasePageModel;
