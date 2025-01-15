import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class PackingListTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page
      .getByRole('region', { name: 'Packing List' })
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

  get recalled() {
    return this.row.locator('td').nth(0);
  }

  get details() {
    return this.row.locator('td').nth(1);
  }

  get productCode() {
    return this.row.locator('td').nth(2);
  }

  get product() {
    return this.row.locator('td').nth(3);
  }

  get binLocation() {
    return this.row.locator('td').nth(4);
  }

  get lotNumber() {
    return this.row.locator('td').nth(5);
  }

  get expirationDate() {
    return this.row.locator('td').nth(6);
  }

  get quantityShipped() {
    return this.row.locator('td').nth(7);
  }

  get unitOfMeasure() {
    return this.row.locator('td').nth(8);
  }

  get recipient() {
    return this.row.locator('td').nth(9);
  }

  get comment() {
    return this.row.locator('td').nth(10);
  }

  get isFullyReceived() {
    return this.row.locator('td').nth(11);
  }
}

export default PackingListTable;
