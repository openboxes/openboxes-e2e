import { Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class OrderHeaderTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  get orderNumberRow() {
    return this.rows.filter({ hasText: 'Order Number' });
  }

  get orderNumberValue() {
    return this.orderNumberRow.locator('.value');
  }

  get statusRow() {
    return this.rows.filter({ hasText: 'Status' });
  }

  get statusRowValue() {
    return this.statusRow.locator('.value');
  }

  get orderTypeRow() {
    return this.rows.filter({ hasText: 'Order Type' });
  }

  get orderTypeValue() {
    return this.orderTypeRow.locator('.value');
  }
}

export default OrderHeaderTable;
