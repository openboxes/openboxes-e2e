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
    return this.row.getByTestId('recalled');
  }

  get details() {
    return this.row.getByTestId('details');
  }

  get productCode() {
    return this.row.getByTestId('product-code');
  }

  get product() {
    return this.row.getByTestId('product');
  }

  get binLocation() {
    return this.row.getByTestId('bin-location');
  }

  get lotNumber() {
    return this.row.getByTestId('lot-number');
  }

  get expirationDate() {
    return this.row.getByTestId('expiration-date');
  }

  get quantityShipped() {
    return this.row.getByTestId('quantity-shipped');
  }

  get quantityReceived() {
    return this.row.getByTestId('quantity-received');
  }

  get quantityCanceled() {
    return this.row.getByTestId('quantity-canceled');
  }

  get unitOfMeasure() {
    return this.row.getByTestId('uom');
  }

  get recipient() {
    return this.row.getByTestId('recipient');
  }

  get comment() {
    return this.row.getByTestId('comment');
  }

  get isFullyReceived() {
    return this.row.getByTestId('is-fully-received');
  }
}

export default PackingListTable;
