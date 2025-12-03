import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ItemStatusTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('item-status-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  getColumnHeader(columnName: string) {
    return this.table.getByRole('row').getByText(columnName, { exact: true });
  }
}

class Row extends BasePageModel {
  row: Locator;
  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get itemStatus() {
    return this.row.getByTestId('order-item-status-code');
  }

  get originBin() {
    return this.row.getByTestId('origin-bin-location');
  }

  get destinationBin() {
    return this.row.getByTestId('destination-bin-location');
  }
}

export default ItemStatusTable;
