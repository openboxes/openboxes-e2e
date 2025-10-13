import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class TransactionTable extends BasePageModel {
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

  get deleteButton() {
    return this.page
      .locator('.action-menu-item')
      .getByRole('link', { name: 'Delete' });
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
}

export default TransactionTable;
