import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ConfirmToRecountTable extends BasePageModel {
  get table() {
    return this.page.locator('.resolve-step-table .ReactTable');
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

  // some of these cells also carry .rt-td, some don't - .static-cell-count-step
  // is the one class every cell in this row shares, so it's the only reliable
  // way to index them all by position
  get cells() {
    return this.row.locator('.static-cell-count-step');
  }

  get binLocation() {
    return this.cells.nth(0);
  }

  get serialLotNumber() {
    return this.cells.nth(1);
  }

  get expirationDate() {
    return this.cells.nth(2);
  }

  get quantityCounted() {
    return this.cells.nth(3);
  }

  get countDifferenceValue() {
    return this.cells.nth(4).locator('.value-indicator');
  }

  get countDifferenceIcon() {
    return this.cells.nth(4).locator('svg');
  }

  get quantityRecounted() {
    return this.cells.nth(5);
  }

  get recountDifferenceValue() {
    return this.cells.nth(6).locator('.value-indicator');
  }

  get recountDifferenceIcon() {
    return this.cells.nth(6).locator('svg');
  }

  get rootCause() {
    return this.cells.nth(7);
  }

  get comment() {
    return this.cells.nth(8);
  }
}

export default ConfirmToRecountTable;
