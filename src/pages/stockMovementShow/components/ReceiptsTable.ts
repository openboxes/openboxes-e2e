import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class ReceiptsListTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page
      .getByRole('region', { name: 'Receipt' })
      .getByRole('table');
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

  get receiptStatus() {
    return this.row.locator('td span').nth(0);
  }

  get receiptNumber() {
    return this.row.locator('td').nth(1);
  }

  get shipmentNumber() {
    return this.row.locator('td').nth(2);
  }

  get transactionNumber() {
    return this.row.locator('td').nth(3);
  }

  get code() {
    return this.row.locator('td').nth(4);
  }

  get product() {
    return this.row.locator('td').nth(5);
  }

  get serialLotNumber() {
    return this.row.locator('td').nth(6);
  }

  get expirationDate() {
    return this.row.locator('td span').nth(7);
  }

  get binLocation() {
    return this.row.locator('td').nth(8);
  }

  get quantityCanceled() {
    return this.row.locator('td').nth(9);
  }

  get quantityPending() {
    return this.row.locator('td').nth(10);
  }

  get quantityReceived() {
    return this.row.locator('td').nth(11);
  }
}

export default ReceiptsListTable;
