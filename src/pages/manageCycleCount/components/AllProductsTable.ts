import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class AllProductsTable extends BasePageModel {
  async isLoaded() {
    await expect(
      this.table.getByRole('button', { name: 'Last Counted' })
    ).toBeVisible();
  }

  get table() {
    return this.page.locator('.ReactTable');
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

  get cells() {
    return this.row.locator('.rt-td');
  }

  get checkbox() {
    return this.cells.nth(0).getByRole('checkbox');
  }

  get lastCounted() {
    return this.cells.nth(1);
  }

  get product() {
    return this.cells.nth(2);
  }

  get category() {
    return this.cells.nth(3);
  }

  get binLocation() {
    return this.cells.nth(4);
  }
  async openBinLocationTooltip() {
    const trigger = this.binLocation.locator('[data-tooltipped]');
    await trigger.hover();
    const describedBy = await trigger.getAttribute('aria-describedby');
    return this.page.locator(`#${describedBy}`);
  }

  get tag() {
    return this.cells.nth(5);
  }

  get productCatalogue() {
    return this.cells.nth(6);
  }

  get abcClass() {
    return this.cells.nth(7);
  }

  get quantity() {
    return this.cells.nth(8);
  }
}

export default AllProductsTable;
