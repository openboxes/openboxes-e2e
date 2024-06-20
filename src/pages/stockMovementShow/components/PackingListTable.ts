import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class PackingListTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('region', { name: 'Packing List' }).getByRole('table');
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
    return this.row.getByRole('gridcell', { name: 'Recalled' });
  }

  get details() {
    return this.row.getByRole('gridcell', { name: 'Details' });
  }

  get productCode() {
    return this.row.getByRole('gridcell', { name: 'Product Code' });
  }

  get product() {
    return this.row.getByRole('gridcell', { name: 'Product' });
  }

  get binLocation() {
    return this.row.getByRole('gridcell', { name: 'Bin Location' });
  }

  get lotNumber() {
    return this.row.getByRole('gridcell', { name: 'Lot Number' });
  }

  get expirationDate() {
    return this.row.getByRole('gridcell', { name: 'Expiration Date' });
  }

  get quantityShipped() {
    return this.row.getByRole('gridcell', { name: 'Quantity Shipped' });
  }

  get unitOfMeasure() {
    return this.row.getByRole('gridcell', { name: 'Unit Of Measure' });
  }

  get recipient() {
    return this.row.getByRole('gridcell', { name: 'Recipient' });
  }

  get comment() {
    return this.row.getByRole('gridcell', { name: 'Comment' });
  }

  get isFullyReceived() {
    return this.row.getByRole('gridcell', { name: 'Is Fully Received' });
  }
}

export default PackingListTable;