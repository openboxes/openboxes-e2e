import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class CreatePutawayTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('wizardPage').getByRole('grid');
  }

  get rows() {
    return this.table.getByRole('rowgroup');
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

  get checkbox() {
    return this.row.getByRole('checkbox');
  }

  getExpandBinLocation(binLocation: string) {
    return this.row
      .getByTestId('cell-undefined-undefined')
      .getByText(binLocation);
  }

  get receivingBin() {
    return this.row.getByTestId('cell-undefined-undefined');
  }

  getProductName(name: string) {
    return this.row.getByTestId('table-cell').getByText(name);
  }
}

export default CreatePutawayTable;
