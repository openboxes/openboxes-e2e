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

  get orderItemRows() {
    return this.table.locator('tr.order-item');
  }

  orderItemRow(index: number) {
    return new Row(this.page, this.orderItemRows.nth(index));
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

  get code() {
    return this.row.getByTestId('product-code');
  }

  get productName() {
    return this.row.getByTestId('product-name');
  }

  get quantity() {
    return this.row.getByTestId('quantity');
  }

  get lotNumber() {
    return this.row.getByTestId('lot-number');
  }

  get expirationDate() {
    return this.row.getByTestId('expiration-date');
  }

  get originBin() {
    return this.row.getByTestId('origin-bin-location');
  }

  get destinationBin() {
    return this.row.getByTestId('destination-bin-location');
  }
}

export default ItemStatusTable;
