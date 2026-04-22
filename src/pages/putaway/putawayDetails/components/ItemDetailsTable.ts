import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ItemDetailsTable extends BasePageModel {
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

  get orderItemRows() {
    return this.table.locator('tr.order-item');
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }
}

export default ItemDetailsTable;
