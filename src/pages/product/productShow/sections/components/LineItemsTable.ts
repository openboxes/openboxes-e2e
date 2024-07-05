import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class LineItemsTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get section() {
    return this.page.getByRole('region', { name: 'Line Items' });
  }

  get saveButton() {
    return this.section.getByRole('button', { name: 'Save' });
  }

  get discardButton() {
    return this.section.getByRole('button', { name: 'Discard' });
  }

  get addNewLineItemButton() {
    return this.section.getByRole('button', { name: 'Add new line item' });
  }

  get table() {
    return this.section.getByRole('table');
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

  get binLocation() {
    return this.row.getByRole('cell', { name: 'Bin Location' });
  }

  get lotNumber() {
    return this.row.getByRole('cell', { name: 'Lot Number' });
  }

  get expires() {
    return this.row.getByRole('cell', { name: 'Expires' });
  }

  get previousQuantity() {
    return this.row.getByRole('cell', { name: 'Previous Quantity' });
  }

  get newQuantity() {
    return this.row.getByRole('cell', { name: 'New Quantity' });
  }

  get comment() {
    return this.row.getByRole('cell', { name: 'Comment' });
  }

  get delete() {
    return this.row.getByRole('cell', { name: 'Delete' });
  }
}

export default LineItemsTable;
