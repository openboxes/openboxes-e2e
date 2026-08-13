import { expect, Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ToCountTable extends BasePageModel {
  async isLoaded() {
    await expect(
      this.table.locator('.rt-th', { hasText: 'Assignee' })
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

  get status() {
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

  get assignee() {
    return this.cells.nth(5);
  }

  get deadline() {
    return this.cells.nth(6);
  }

  get inventoryItemsCount() {
    return this.cells.nth(7);
  }

  get quantity() {
    return this.cells.nth(8);
  }
}

export default ToCountTable;
