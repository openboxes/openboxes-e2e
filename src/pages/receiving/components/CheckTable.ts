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
    return this.table
      .locator('.table-header')
      .getByText(columnName, { exact: true });
  }

  getCellValue(row: number, column: string) {
    return this.table
      .getByRole('row')
      .nth(row)
      .getByRole('cell', { name: column, exact: true });
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

  get cancelRemainingCheckbox() {
    return this.row.getByTestId('checkbox');
  }
}

export default CheckTable;
