import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class RecordStockTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get section() {
    return this.page.getByRole('region', { name: 'Record Stock' });
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
}

export default RecordStockTable;
