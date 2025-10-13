import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class SummaryTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('table');
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

  getProductName(name: string) {
    return this.row
      .locator('[class="order-item even dataRow"]')
      .getByRole('link')
      .getByText(name);
  }
}

export default SummaryTable;
