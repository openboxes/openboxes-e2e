import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ConfirmToCountTable extends BasePageModel {
  get table() {
    return this.page.locator('.count-step-table .ReactTable');
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

  get comment() {
    return this.cells.nth(4);
  }
}

export default ConfirmToCountTable;
