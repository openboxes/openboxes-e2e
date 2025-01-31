import { Locator, Page } from '@playwright/test';

import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class ReceivingTable extends BasePageModel {
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

  getCellValue(row: number, column: string) {
    return this.table
      .getByRole('row')
      .nth(row)
      .getByRole('cell', { name: column });
  }
}

class Row extends BasePageModel {
  row: Locator;
  receivingNowField: TextField;
  commentField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.receivingNowField = new TextField(page, 'Receiving now', row);
    this.commentField = new TextField(page, 'Comment', row);
  }

  get checkbox() {
    return this.row.getByRole('checkbox');
  }

  get editButton() {
    return this.row.getByRole('button', { name: 'Edit' });
  }

  getItem(name: string) {
    return this.row.getByTestId('label-field').getByText(name);
  }

  get binLocationSelect() {
    return this.row.getByRole('cell', { name: 'Bin Location' });
  }

  getBinLocation(binLocation: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .getByRole('listitem')
      .getByText(binLocation, { exact: true });
  }

  getZoneLocation(zoneLocation: string) {
    return this.page
      .getByTestId('custom-select-dropdown-menu')
      .locator('.css-5ih5ya-group react-select__group-heading')
      .getByText(zoneLocation, { exact: true });
  }
}

export default ReceivingTable;
