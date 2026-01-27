import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CompletePutawayTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('wizardPage').getByRole('grid');
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

  getputawayBin(rowIndex: number) {
    return this.row.getByTestId(`cell-${rowIndex}-undefined`).nth(9);
  }
}

export default CompletePutawayTable;
