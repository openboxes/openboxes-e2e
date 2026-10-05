import { Locator, Page } from '@playwright/test';

import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class ReceivingTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('receiving-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  // rows are 1-indexed by convention (row 1 is the first item), matching the
  // rest of the receiving page objects. Unlike the old table, the header row
  // no longer carries role="row", so it doesn't occupy index 0 on its own.
  row(index: number) {
    return new Row(this.page, this.rows.nth(index - 1));
  }

  getColumnHeader(columnName: string) {
    return this.table
      .locator('.rt-thead')
      .getByText(columnName, { exact: true });
  }

  getCellValue(row: number, column: string) {
    return this.rows.nth(row - 1).locator(`[aria-label="${column}"]`);
  }
}

class Row extends BasePageModel {
  row: Locator;
  receivingNowField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.receivingNowField = new TextField(page, 'Receiving now', row);
  }

  get editButton() {
    return this.row.getByRole('button', { name: 'Edit' });
  }

  get commentButton() {
    return this.row.getByRole('button', { name: 'Comment' });
  }

  // visible only when the "Show Putaway" switch is on
  get binLocationSelect() {
    return this.row.locator('[aria-label="Location"]');
  }

  getItem(name: string) {
    return this.row.locator('[aria-label="Product"]').getByText(name);
  }
}

export default ReceivingTable;
