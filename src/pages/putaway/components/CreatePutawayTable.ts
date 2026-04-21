import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';
import { formatDate } from '@/utils/DateUtils';

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

  get tableCell() {
    return this.row.getByTestId('table-cell');
  }

  getExpandBinLocation(binLocation: string) {
    return this.tableCell.getByText(binLocation);
  }

  get receivingBin() {
    return this.row.getByTestId('table-cell');
  }

  getProductName(name: string) {
    return this.tableCell.getByText(name);
  }

  getLot(lot: string) {
    return this.tableCell.getByText(lot);
  }

  getExpDate(expDate: Date) {
    return this.tableCell.getByText(
      formatDate(expDate, 'MM/DD/YYYY').toString()
    );
  }
}

export default CreatePutawayTable;
