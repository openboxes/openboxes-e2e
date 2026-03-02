import { Locator, Page } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class PutawayListTable extends BasePageModel {
  get table() {
    return this.page.getByRole('table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }

  async clickDeleteOrderButton(index: number) {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.row(index).deleteOrder.click();
  }
}

class Row extends BasePageModel {
  row: Locator;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
  }

  get actionsButton() {
    return this.row.getByTestId('action-menu');
  }

  get statusTag() {
    return this.row.getByTestId('status');
  }

  get orderNumber() {
    return this.row.getByTestId('order-number');
  }

  get viewOrderDetails() {
    return this.row.getByTestId('view-details-item');
  }

  get deleteOrder() {
    return this.row.getByTestId('delete-order-item');
  }
}
export default PutawayListTable;
