import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class SummaryTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('cell');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  getColumnHeader(columnName: string) {
    return this.table.getByRole('row').getByText(columnName);
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get productName() {
    return this.row.getByTestId('product-name');
  }
}

export default SummaryTable;
