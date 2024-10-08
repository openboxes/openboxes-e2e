import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CheckTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('items-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  getColumnHeader(columnName: string) {
    return this.table.locator('.table-header').getByText(columnName);
  }

  get receivingNowColumnContent() {
    return this.table
      .getByRole('row')
      .nth(1)
      .locator('.table-inner-row > div')
      .nth(8);
  }

  get remainingColumnContent() {
    return this.table
      .getByRole('row')
      .nth(1)
      .locator('.table-inner-row > div')
      .nth(9);
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  getItem(name: string) {
    return this.row.getByTestId('label-field').getByText(name);
  }
}

export default CheckTable;
