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

  // rows mixes container rows with item rows (e.g. the first item is at
  // row(1), and multi-container shipments leave gaps), so it can't be indexed
  // by item position.
  get itemRows() {
    return this.rows.filter({
      has: this.page
        .getByTestId('label-field')
        .and(this.page.getByLabel('Code', { exact: true })),
    });
  }

  itemRow(index: number) {
    return new Row(this.page, this.itemRows.nth(index));
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

  get code() {
    return this.row
      .getByTestId('label-field')
      .and(this.row.getByLabel('Code', { exact: true }));
  }

  get cancelRemainingCheckbox() {
    return this.row.getByTestId('form-field').getByTestId('checkbox');
  }
}

export default CheckTable;
