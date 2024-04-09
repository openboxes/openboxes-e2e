import { Page } from '@playwright/test';

abstract class BasePageModel {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

export default BasePageModel;
