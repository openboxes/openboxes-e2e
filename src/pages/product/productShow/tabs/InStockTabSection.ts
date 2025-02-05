import BasePageModel from '@/pages/BasePageModel';
import { expect, Locator, Page } from '@playwright/test';

class InStockTabSection extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  async isLoaded() {
    await expect(
      this.page.getByRole('heading').getByText('Current stock')
    ).toBeVisible();
  }

  get table() {
    return this.page.locator('#ui-tabs-1').getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get actionsButton() {
    return this.row.locator('.action-menu').getByRole('button');
  }

  get binLocation() {
    return this.row
      .locator('.line')
      .locator('.line-extension')
      .getByRole('link');
  }

  get zoneLocation() {
    return this.row.locator('.line').locator('.line-base').getByRole('link');
  }
}

export default InStockTabSection;
