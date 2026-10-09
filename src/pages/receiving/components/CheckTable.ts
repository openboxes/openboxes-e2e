import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CheckTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('confirm-receipt-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  // rows are 1-indexed by convention (row 1 is the first item). Unlike the
  // old table, the header row no longer carries role="row", so it doesn't
  // occupy index 0 on its own.
  row(index: number) {
    return new Row(this.page, this.rows.nth(index - 1));
  }

  // rows mixes container rows with item rows (e.g. the first item is at
  // row(1), and multi-container shipments leave gaps), so it can't be indexed
  // by item position.
  get itemRows() {
    return this.rows.filter({
      has: this.page.locator('[aria-label="Code"]'),
    });
  }

  itemRow(index: number) {
    return new Row(this.page, this.itemRows.nth(index));
  }

  // the order of the items isn't guaranteed to match the receiving step, so
  // find the row by its product code instead of its position
  rowByProductCode(productCode: string) {
    return new Row(
      this.page,
      this.rows.filter({
        has: this.page
          .locator('[aria-label="Code"]')
          .getByText(productCode, { exact: true }),
      })
    );
  }

  getColumnHeader(columnName: string) {
    return this.table
      .getByTestId('table-header')
      .getByText(columnName, { exact: true });
  }

  getCellValue(row: number, column: string) {
    return this.rows.nth(row - 1).locator(`[aria-label="${column}"]`);
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  getItem(name: string) {
    return this.row.locator('[aria-label="Product"]').getByText(name);
  }

  get code() {
    return this.row.locator('[aria-label="Code"]');
  }

  get status() {
    return this.row.locator('[aria-label="Status"]');
  }

  get cancelRemainingCheckbox() {
    return this.row
      .locator('[data-column-id="cancelRemaining"]')
      .getByRole('checkbox');
  }
}

export default CheckTable;
